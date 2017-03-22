import { push } from 'react-router-redux';
import download from 'downloadjs';

import {
  getSourceFundsWithToken,
  getTargetFundsWithToken,
  saveMandateWithToken,
  downloadMandatePreviewWithIdAndToken,
  getMobileIdSignatureChallengeCodeForMandateIdWithToken,
  getMobileIdSignatureStatusForMandateIdWithToken,
  downloadMandateWithIdAndToken,
} from '../common/api';
import {
  GET_SOURCE_FUNDS_START,
  GET_SOURCE_FUNDS_SUCCESS,
  GET_SOURCE_FUNDS_ERROR,

  SELECT_EXCHANGE_SOURCES,

  GET_TARGET_FUNDS_START,
  GET_TARGET_FUNDS_SUCCESS,
  GET_TARGET_FUNDS_ERROR,

  SELECT_TARGET_FUND,

  SIGN_MANDATE_MOBILE_ID_START,
  SIGN_MANDATE_MOBILE_ID_START_SUCCESS,
  SIGN_MANDATE_MOBILE_ID_START_ERROR,
  SIGN_MANDATE_INVALID_ERROR,
  SIGN_MANDATE_MOBILE_ID_SUCCESS,
  SIGN_MANDATE_MOBILE_ID_ERROR,
  SIGN_MANDATE_MOBILE_ID_CANCEL,

  CHANGE_AGREEMENT_TO_TERMS,
} from './constants';

const POLL_DELAY = 1000;

const SIGNING_IN_PROGRESS_STATUS = 'OUTSTANDING_TRANSACTION';

let timeout;

export function getSourceFunds() {
  return (dispatch, getState) => {
    dispatch({ type: GET_SOURCE_FUNDS_START });
    return getSourceFundsWithToken(getState().login.token)
      .then((sourceFunds) => {
        if (sourceFunds.length === 0) {
          dispatch(push('/account'));
          return;
        }
        dispatch({ type: GET_SOURCE_FUNDS_SUCCESS, sourceFunds });
      })
      .catch(error => dispatch({ type: GET_SOURCE_FUNDS_ERROR, error }));
  };
}

export function selectExchangeSources(sourceSelection, sourceSelectionExact = false) {
  return { type: SELECT_EXCHANGE_SOURCES, sourceSelection, sourceSelectionExact };
}

export function changeAgreementToTerms(agreement) {
  return { type: CHANGE_AGREEMENT_TO_TERMS, agreement };
}

export function downloadMandate() {
  return (dispatch, getState) => {
    const mandateId = getState().exchange.signedMandateId;
    const token = getState().login.token;
    if (mandateId && token) {
      return downloadMandateWithIdAndToken(mandateId, token)
        .then(file => download(file, 'Tuleva_avaldus.bdoc', 'application/bdoc'));
    }
    return Promise.resolve();
  };
}

export function getTargetFunds() {
  return (dispatch, getState) => {
    dispatch({ type: GET_TARGET_FUNDS_START });
    return getTargetFundsWithToken(getState().login.token)
      .then(targetFunds => dispatch({ type: GET_TARGET_FUNDS_SUCCESS, targetFunds }))
      .catch(error => dispatch({ type: GET_TARGET_FUNDS_ERROR, error }));
  };
}

export function selectFutureContributionsFund(targetFundIsin) {
  return { type: SELECT_TARGET_FUND, targetFundIsin };
}

function pollForMandateSignatureWithMandateId(id) {
  return (dispatch, getState) => {
    if (timeout && process.env.NODE_ENV !== 'test') {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      getMobileIdSignatureStatusForMandateIdWithToken(id, getState().login.token)
        .then((statusCode) => {
          if (statusCode === SIGNING_IN_PROGRESS_STATUS) {
            dispatch(pollForMandateSignatureWithMandateId(id));
          } else {
            dispatch({ type: SIGN_MANDATE_MOBILE_ID_SUCCESS, signedMandateId: id });
            dispatch(push('/steps/success'));
          }
        })
        .catch(error => dispatch({ type: SIGN_MANDATE_MOBILE_ID_ERROR, error }));
    }, POLL_DELAY);
  };
}

function handleSaveMandateError(dispatch, error) {
  if (error.status === 422) {
    dispatch({ type: SIGN_MANDATE_INVALID_ERROR, error });
  } else {
    dispatch({ type: SIGN_MANDATE_MOBILE_ID_START_ERROR, error });
  }
}

export function previewMandate(mandate) {
  return (dispatch, getState) => {
    const token = getState().login.token;
    return saveMandateWithToken(mandate, token)
        .then(({ id }) => downloadMandatePreviewWithIdAndToken(id, token).then(file => download(file, 'Tuleva_avaldus_eelvaade.zip', 'application/zip'))
        .catch((error) => {
          handleSaveMandateError(dispatch, error);
        }));
  };
}

export function signMandateWithMobileId(mandate) {
  return (dispatch, getState) => {
    dispatch({ type: SIGN_MANDATE_MOBILE_ID_START });
    const token = getState().login.token;
    let mandateId;
    return saveMandateWithToken(mandate, token)
      .then(({ id }) => {
        mandateId = id;
        return getMobileIdSignatureChallengeCodeForMandateIdWithToken(id, token);
      })
      .then((controlCode) => {
        dispatch({ type: SIGN_MANDATE_MOBILE_ID_START_SUCCESS, controlCode });
        dispatch(pollForMandateSignatureWithMandateId(mandateId));
      })
      .catch((error) => {
        handleSaveMandateError(dispatch, error);
      });
  };
}

export function cancelSigningMandate() {
  if (timeout && process.env.NODE_ENV !== 'test') {
    clearTimeout(timeout);
  }
  return { type: SIGN_MANDATE_MOBILE_ID_CANCEL };
}
