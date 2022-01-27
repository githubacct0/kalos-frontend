import { JobSubtype } from '@kalos-core/kalos-rpc/JobSubtype';
import { JobType } from '@kalos-core/kalos-rpc/JobType';
import { JobTypeSubtype } from '@kalos-core/kalos-rpc/JobTypeSubtype';
import { Property } from '@kalos-core/kalos-rpc/Property';
import { ServicesRendered } from '@kalos-core/kalos-rpc/ServicesRendered';
import { User } from '@kalos-core/kalos-rpc/User';
import { Event } from '@kalos-core/kalos-rpc/Event';
import { Option } from '../Field';

export interface State {
  requestFields: string[];
  tabIdx: number;
  tabKey: number;
  pendingSave: boolean;
  saveInvoice: boolean;
  requestValid: boolean;
  serviceCallId: number;
  entry: Event;
  property: Property;
  customer: User;
  propertyEvents: Event[];
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  error: boolean;
  loggedUserRole: string;
  errorMessage: string;
  jobTypes: JobType[];
  jobSubtypes: JobSubtype[];
  jobTypeSubtypes: JobTypeSubtype[];
  jobSubTypeOptions: Option[];
  servicesRendered: ServicesRendered[];
  loggedUser: User;
  notificationEditing: boolean;
  notificationViewing: boolean;
  projects: Event[];
  parentId: number | null;
  confirmedParentId: number | null;
  projectData: Event;
  openSpiffApply: boolean;
  openJobActivity: boolean;
}

export type Action =
  | { type: 'setServiceCallId'; data: number }
  | {
      type: 'setData';
      data: {
        property: Property;
        customer: User;
        propertyEvents: Event[];
        jobTypes: JobType[];
        jobSubtypes: JobSubtype[];
        jobTypeSubtypes: JobTypeSubtype[];
        loggedUser: User;
        entry: Event;
        servicesRendered: ServicesRendered[];
        loaded: boolean;
        loading: boolean;
      };
    }
  | { type: 'setEntry'; data: Event }
  | {
      type: 'setChangeEntry';
      data: {
        entry: Event;
        pendingSave: boolean;
      };
    }
  | {
      type: 'setHandleSave';
      data: {
        pendingSave: boolean;
        requestValid: boolean;
      };
    }
  | { type: 'setSaving'; data: boolean }
  | { type: 'setLoading'; data: boolean }
  | {
      type: 'setLoadedLoading';
      data: {
        loaded: boolean;
        loading: boolean;
      };
    }
  | {
      type: 'setSaveServiceCall';
      data: {
        saving: boolean;
        loading: boolean;
        pendingSave: boolean;
      };
    }
  | { type: 'setRequestValid'; data: boolean }
  | { type: 'setRequestFields'; data: string[] }
  | { type: 'setPendingSave'; data: boolean }
  | {
      type: 'setError';
      data: {
        error: boolean;
        msg: string;
      };
    }
  | {
      type: 'setServicesRendered';
      data: {
        servicesRendered: ServicesRendered[];
        loading: boolean;
      };
    }
  | { type: 'setTabId'; data: number }
  | {
      type: 'setTabAndPendingSave';
      data: {
        tabIdx: number;
        tabKey: number;
        pendingSave: boolean;
      };
    }
  | {
      type: 'setSaveInvoice';
      data: {
        pendingSave: boolean;
        requestValid: boolean;
        saveInvoice: boolean;
      };
    }
  | {
      type: 'setSavingLoading';
      data: {
        saving: boolean;
        loading: boolean;
      };
    }
  | {
      type: 'setSavingNoteEditing';
      data: {
        saving: boolean;
        notificationEditing: boolean;
      };
    }
  | { type: 'setOpenSpiffApply'; data: boolean }
  | { type: 'setNotificationEditing'; data: boolean }
  | { type: 'setNotificationViewing'; data: boolean }
  | {
      type: 'setOpenJobActivity';
      data: boolean;
    };

export const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'setServiceCallId':
      return {
        ...state,
        serviceCallID: action.data,
      };
    case 'setData': {
      let roleType = '';
      let role = action.data.loggedUser
        .getPermissionGroupsList()
        .find(permission => permission.getType() == 'role');
      if (role) {
        roleType = role.getName();
      }
      return {
        ...state,
        property: action.data.property,
        customer: action.data.customer,
        propertyEvents: action.data.propertyEvents,
        jobTypes: action.data.jobTypes,
        jobSubtypes: action.data.jobSubtypes,
        jobTypeSubtypes: action.data.jobTypeSubtypes,
        loggedUser: action.data.loggedUser,
        entry: action.data.entry,
        servicesRendered: action.data.servicesRendered,
        loaded: action.data.loaded,
        loading: action.data.loading,
        loggedUserRole: roleType,
      };
    }
    case 'setEntry':
      return {
        ...state,
        entry: action.data,
      };
    case 'setChangeEntry':
      return {
        ...state,
        entry: action.data.entry,
        pendingSave: action.data.pendingSave,
      };
    case 'setHandleSave':
      return {
        ...state,
        pendingSave: action.data.pendingSave,
        requestValid: action.data.requestValid,
      };
    case 'setSaving':
      return {
        ...state,
        saving: action.data,
      };
    case 'setLoading':
      return {
        ...state,
        loading: action.data,
      };
    case 'setLoadedLoading':
      return {
        ...state,
        loaded: action.data.loaded,
        loading: action.data.loading,
      };
    case 'setSaveServiceCall':
      return {
        ...state,
        saving: action.data.saving,
        loading: action.data.loading,
        pendingSave: action.data.pendingSave,
      };
    case 'setRequestValid':
      return {
        ...state,
        requestValid: action.data,
      };
    case 'setRequestFields':
      return {
        ...state,
        requestFields: action.data,
      };
    case 'setPendingSave':
      return {
        ...state,
        pendingSave: action.data,
      };
    case 'setError':
      return {
        ...state,
        error: action.data.error,
        errorMessage: action.data.msg,
      };
    case 'setServicesRendered':
      return {
        ...state,
        servicesRendered: action.data.servicesRendered,
        loading: action.data.loading,
      };
    case 'setTabId':
      return {
        ...state,
        tabIdx: action.data,
      };
    case 'setTabAndPendingSave':
      return {
        ...state,
        tabIdx: action.data.tabIdx,
        tabKey: action.data.tabKey,
        pendingSave: action.data.pendingSave,
      };
    case 'setSaveInvoice':
      return {
        ...state,
        pendingSave: action.data.pendingSave,
        requestValid: action.data.requestValid,
        saveInvoice: action.data.saveInvoice,
      };
    case 'setSavingLoading':
      return {
        ...state,
        saving: action.data.saving,
        loading: action.data.loading,
      };
    case 'setSavingNoteEditing':
      return {
        ...state,
        saving: action.data.saving,
        notificationEditing: action.data.notificationEditing,
      };
    case 'setNotificationViewing':
      return {
        ...state,
        notificationViewing: action.data,
      };
    case 'setNotificationEditing':
      return {
        ...state,
        notificationEditing: action.data,
      };
    case 'setOpenSpiffApply':
      return {
        ...state,
        openSpiffApply: action.data,
      };
    case 'setOpenJobActivity': {
      return {
        ...state,
        openJobActivity: action.data,
      };
    }
    default:
      return state;
  }
};