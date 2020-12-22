import React, { FC, useRef, useEffect, useCallback, useState } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import PrintIcon from '@material-ui/icons/Print';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import { useReactToPrint } from 'react-to-print';
import { PrintHeader, Props as HeaderProps } from '../PrintHeader';
import { PrintFooter, Props as FooterProps } from '../PrintFooter';
import { Button, Props as ButtonProps } from '../Button';
import { getUploadedHTMLUrl, setInlineStyles } from '../../../helpers';
import './styles.css';

export type Status = 'idle' | 'loading' | 'loaded';

interface Props {
  headerProps?: HeaderProps;
  footerProps?: FooterProps;
  buttonProps?: ButtonProps;
  onPrint?: () => void;
  onPrinted?: () => void;
  status?: Status;
  downloadPdfFilename?: string;
  className?: string;
  downloadLabel?: string;
  icons?: boolean;
  onFileCreated?: (file: Uint8Array) => void;
}

export const PrintPage: FC<Props> = ({
  headerProps,
  footerProps,
  buttonProps = {},
  onPrint,
  onPrinted,
  children,
  status,
  downloadPdfFilename,
  className = '',
  downloadLabel = 'Download',
  icons = false,
  onFileCreated,
}) => {
  const printRef = useRef(null);
  const [fileReturned, setFileReturned] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    copyStyles: true,
    pageStyle: '',
  });
  const handleDownload = useCallback(
    (open: boolean) => async () => {
      if (printRef.current) {
        setDownloading(true);
        // @ts-ignore
        setInlineStyles(printRef.current);
        // @ts-ignore
        const content = printRef.current.innerHTML;
        const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${downloadPdfFilename}</title>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `;
        const url = await getUploadedHTMLUrl(
          html,
          `${downloadPdfFilename}.pdf`,
        );
        if (open) {
          window.open(url, '_blank');
        }
        setDownloading(false);
        return url;
      }
    },
    [printRef, setDownloading, downloadPdfFilename],
  );
  const handleFileCreated = useCallback(async () => {
    const url = await handleDownload(false)();
    if (url) {
      const file = await fetch(url);
      const blob = await file.blob();
      const fr = new FileReader();
      fr.onload = () => {
        if (onFileCreated) {
          console.log('on file created');
          onFileCreated(new Uint8Array(fr.result as ArrayBuffer));
        } else {
          const el = document.createElement('a');
          console.log({ downloadPdfFilename });
          el.download = `${downloadPdfFilename}_affadavit.pdf`;
          el.href = URL.createObjectURL(blob);
          el.target = '_blank';
          el.click();
          el.remove();
        }
      };
      fr.readAsArrayBuffer(blob);
    }
  }, [handleDownload]);
  useEffect(() => {
    if (status === 'loaded') {
      handlePrint!();
      if (onPrinted) {
        onPrinted();
      }
    }
    if (onFileCreated && !fileReturned) {
      setFileReturned(true);
      handleFileCreated();
    }
  }, [
    status,
    handlePrint,
    onPrinted,
    onFileCreated,
    handleFileCreated,
    fileReturned,
    setFileReturned,
  ]);
  return (
    <>
      <span className={className}>
        {downloadPdfFilename &&
          (icons ? (
            <IconButton
              onClick={handleDownload(true)}
              size="small"
              disabled={
                status === 'loading' || downloading || buttonProps.disabled
              }
            >
              {(status === 'loading' || downloading) && (
                <CircularProgress
                  style={{ position: 'absolute', color: '#FFF' }}
                  size={12}
                />
              )}
              <DownloadIcon />
            </IconButton>
          ) : (
            <Button
              onClick={handleDownload(true)}
              children={
                (status === 'loading' || downloading) && (
                  <CircularProgress
                    style={{ color: '#FFF', marginRight: 8 }}
                    size={16}
                  />
                )
              }
              {...buttonProps}
              disabled={
                status === 'loading' || downloading || buttonProps.disabled
              }
              label={downloadLabel}
            />
          ))}
        {onFileCreated ? null : icons ? (
          <IconButton
            onClick={onPrint || handlePrint!}
            size="small"
            disabled={status === 'loading' || buttonProps.disabled}
          >
            <PrintIcon />
          </IconButton>
        ) : (
          <Button
            label="Print"
            onClick={onPrint || handlePrint!}
            children={
              status === 'loading' && (
                <CircularProgress
                  style={{ color: '#FFF', marginRight: 8 }}
                  size={16}
                />
              )
            }
            {...buttonProps}
            disabled={status === 'loading' || buttonProps.disabled}
          />
        )}
      </span>
      <div className="PrintPage">
        <div ref={printRef}>
          {headerProps && <PrintHeader {...headerProps} />}
          <table className="PrintPage_table">
            <tbody>
              <tr>
                <td>{children}</td>
              </tr>
            </tbody>
            {footerProps && (
              <tfoot className="PrintPage_tfoot">
                <tr>
                  <td>
                    <div style={{ height: footerProps.height }}>
                      <PrintFooter {...footerProps} />
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </>
  );
};
