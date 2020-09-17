import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import CopyIcon from '@material-ui/icons/FileCopySharp';
import SubmitIcon from '@material-ui/icons/ThumbUpSharp';
import RejectIcon from '@material-ui/icons/ThumbDownSharp';
import KeyboardIcon from '@material-ui/icons/KeyboardSharp';
import UploadIcon from '@material-ui/icons/CloudUploadSharp';
import NotesIcon from '@material-ui/icons/EditSharp';
import CheckIcon from '@material-ui/icons/CheckCircleSharp';
import CloseIcon from '@material-ui/icons/Close';
import { Prompt } from '../../Prompt/main';
import { Transaction } from '@kalos-core/kalos-rpc/Transaction';
import { S3Client } from '@kalos-core/kalos-rpc/S3File';
import { TransactionDocumentClient } from '@kalos-core/kalos-rpc/TransactionDocument';
import { UserClient, User } from '@kalos-core/kalos-rpc/User';
import { EmailClient, EmailConfig } from '@kalos-core/kalos-rpc/Email';
import { TxnLog } from './log';
import { TxnNotes } from './notes';
import { getSlackID, slackNotify } from '../../../helpers';
import { ENDPOINT } from '../../../constants';
import { CostCenterPicker } from '../../Pickers/CostCenter';
import { AltGallery, GalleryData } from '../../AltGallery/main';
import { Row } from '../../ComponentsLibrary/InfoTable';
import { Tooltip } from '../../ComponentsLibrary/Tooltip';

interface props {
  txn: Transaction.AsObject;
  departmentView: boolean;
  acceptOverride: boolean;
  userID: number;
  enter(): Promise<void>;
  audit(): Promise<void>;
  accept(): Promise<void>;
  reject(reason?: string): Promise<void>;
  refresh(): Promise<void>;
  addJobNumber(jn: string): Promise<void>;
  updateNotes(notes: string): Promise<void>;
  updateCostCenter(id: number): Promise<void>;
  updateDepartment(id: number): Promise<void>;
  toggleLoading(cb?: () => void): void;
  editingCostCenter: boolean;
  toggleEditingCostCenter(): void;
}

export function TransactionRow({
  txn,
  enter,
  accept,
  reject,
  refresh,
  audit,
  addJobNumber,
  updateNotes,
  acceptOverride,
  updateCostCenter,
  userID,
  editingCostCenter,
  toggleEditingCostCenter,
}: props): Row {
  const FileInput = React.createRef<HTMLInputElement>();

  const clients = {
    user: new UserClient(ENDPOINT),
    email: new EmailClient(ENDPOINT),
    docs: new TransactionDocumentClient(ENDPOINT),
    s3: new S3Client(ENDPOINT),
  };

  const handleFile = (e: any) => {
    const fr = new FileReader();
    fr.onload = async () => {
      try {
        const u8 = new Uint8Array(fr.result as ArrayBuffer);
        await clients.docs.upload(
          txn.id,
          FileInput.current!.files![0].name,
          u8,
        );
      } catch (err) {
        alert('File could not be uploaded');
        console.log(err);
      }

      await refresh();
      alert('Upload complete!');
    };
    if (FileInput.current && FileInput.current.files) {
      fr.readAsArrayBuffer(FileInput.current.files[0]);
    }
  };

  const openFileInput = () => {
    FileInput.current && FileInput.current.click();
  };

  const updateStatus = async () => {
    const ok = confirm(
      `Are you sure you want to mark this transaction as ${
        acceptOverride ? 'accepted' : 'recorded'
      }?`,
    );
    if (ok) {
      const fn = acceptOverride ? accept : enter;
      await fn();
      await refresh();
    }
  };

  const auditTxn = async () => {
    const ok = confirm(
      'Are you sure you want to mark all the information on this transaction (including all attached photos) as correct? This action is irreversible.',
    );
    if (ok) {
      await audit();
      await refresh();
    }
  };

  const dispute = async (reason: string) => {
    const userReq = new User();
    userReq.setId(txn.ownerId);
    const user = await clients.user.Get(userReq);
    const body = `Reason: ${reason}\r\nInfo: ${prettyMoney(txn.amount)} - ${
      txn.description
    } - ${
      txn.vendor
    }\r\nReview transactions here: https://app.kalosflorida.com?action=admin:reports.transactions`;
    const email: EmailConfig = {
      type: 'receipts',
      recipient: user.email,
      body,
    };

    try {
      await clients.email.sendMail(email);
    } catch (err) {
      alert('An error occurred, user was not notified via email');
    }
    try {
      const id = await getSlackID(txn.ownerName);
      await slackNotify(
        id,
        `A receipt you submitted has been rejected | ${
          txn.description
        } | $${prettyMoney(txn.amount)}. Reason: ${reason}`,
      );
      await slackNotify(
        id,
        `https://app.kalosflorida.com?action=admin:reports.transactions`,
      );
    } catch (err) {
      console.log(err);
      alert('An error occurred, user was not notified via slack');
    }

    await reject(reason);
    await refresh();
  };

  const handleCostCenterSelect = async (id: number) => {
    await updateCostCenter(id);
    toggleEditingCostCenter();
  };

  const amount = prettyMoney(txn.amount);
  return [
    {
      value: new Date(txn.timestamp.split(' ').join('T')).toLocaleDateString(),
    },
    {
      value: `${txn.ownerName} (${txn.cardUsed})` || '',
    },
    {
      value: editingCostCenter ? (
        <CostCenterPicker
          selected={txn.costCenter ? txn.costCenter.id : 0}
          onSelect={handleCostCenterSelect}
          hideInactive
        />
      ) : txn.costCenter ? (
        `${txn.costCenter.description} (${txn.costCenter.id})`
      ) : (
        ''
      ),
      actions: [
        <IconButton key="edit" size="small" onClick={toggleEditingCostCenter}>
          {editingCostCenter ? <CloseIcon /> : <EditIcon />}
        </IconButton>,
      ],
    },
    {
      value: txn.department
        ? `${txn.department.description} (${txn.department.classification})`
        : '',
    },
    {
      value: txn.jobId,
    },
    {
      value: `$ ${amount}`,
    },
    {
      value: txn.vendor,
    },
    {
      value: '',
      actions: [
        <Tooltip key="copy" content="Copy data to clipboard">
          <IconButton
            size="small"
            onClick={() =>
              copyToClipboard(
                `${new Date(
                  txn.timestamp.split(' ').join('T'),
                ).toLocaleDateString()},${txn.description},${amount},${
                  txn.ownerName
                },${txn.vendor}`,
              )
            }
          >
            <CopyIcon />
          </IconButton>
        </Tooltip>,
        <Tooltip key="upload" content="Upload File">
          <IconButton size="small" onClick={openFileInput}>
            <UploadIcon />
            <input
              type="file"
              ref={FileInput}
              onChange={handleFile}
              style={{ display: 'none' }}
            />
          </IconButton>
        </Tooltip>,
        <Prompt
          key="updateJobNumber"
          confirmFn={addJobNumber}
          text="Update Job Number"
          prompt="New Job Number: "
          Icon={KeyboardIcon}
        />,
        <Prompt
          key="editNotes"
          confirmFn={updateNotes}
          text="Edit Notes"
          prompt="Update Txn Notes: "
          Icon={NotesIcon}
          defaultValue={txn.notes}
          multiline
        />,
        <AltGallery
          key="receiptPhotos"
          title="Transaction Photos"
          fileList={getGalleryData(txn)}
          transactionID={txn.id}
          text="View photos"
          iconButton
        />,
        <TxnLog key="txnLog" iconButton txnID={txn.id} />,
        <TxnNotes
          key="viewNotes"
          iconButton
          text="View notes"
          notes={txn.notes}
          disabled={txn.notes === ''}
        />,
        ...([9928, 9646, 1734].includes(userID)
          ? [
              <Tooltip
                key="audit"
                content={
                  txn.isAudited
                    ? 'This transaction has already been aduited'
                    : 'Mark as correct'
                }
              >
                <IconButton
                  size="small"
                  onClick={auditTxn}
                  disabled={txn.isAudited}
                >
                  <CheckIcon />
                </IconButton>
              </Tooltip>,
            ]
          : []),
        <Tooltip
          key="submit"
          content={acceptOverride ? 'Mark as accepted' : 'Mark as entered'}
        >
          <IconButton size="small" onClick={updateStatus}>
            <SubmitIcon />
          </IconButton>
        </Tooltip>,
        <Prompt
          key="reject"
          confirmFn={dispute}
          text="Reject transaction"
          prompt="Enter reason for rejection: "
          Icon={RejectIcon}
        />,
      ],
      actionsFullWidth: true,
    },
  ];
}

function copyToClipboard(text: string): void {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

export function prettyMoney(amount: number): string {
  const [dollars, cents] = amount.toString().split('.');
  if (!cents) {
    return `${dollars}.00`;
  } else if (cents.length === 1) {
    return `${dollars}.${cents}0`;
  } else {
    return `${dollars}.${cents}`;
  }
}

function getGalleryData(txn: Transaction.AsObject): GalleryData[] {
  return txn.documentsList.map(d => {
    return {
      key: `${txn.id}-${d.reference}`,
      bucket: 'kalos-transactions',
    };
  });
}
