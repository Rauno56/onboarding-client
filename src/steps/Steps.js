import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';

import './Steps.scss';

import StepTitle from './stepTitle';

const orderedStepNames = [
  'select-exchange',
  'select-fund',
  'transfer-future-capital',
  'confirm-application',
];

// this component wraps all steps and renders the top and bottom areas.
const Steps = ({ children, stepName }) => {
  const stepIndex = orderedStepNames.indexOf(stepName);
  const beforeSteps = orderedStepNames.slice(0, stepIndex);
  const currentStep = orderedStepNames[stepIndex];
  const afterSteps = orderedStepNames.slice(stepIndex + 1);
  return (
    <div className="row">
      <div className="col px-0 tv-steps">
        {
          beforeSteps.map((beforeStep, index) =>
            <StepTitle key={beforeStep} number={index + 1}>
              {beforeStep}
            </StepTitle>,
          )
        }
        <StepTitle number={stepIndex + 1} active>{currentStep}</StepTitle>
        <div className="px-col pb-4 tv-step__content">{children}</div>
        <hr className="mb-4" />
        {
          afterSteps.map((afterStep, index) =>
            <StepTitle key={afterStep} number={index + 1 + stepIndex + 1}>
              {afterStep}
            </StepTitle>,
          )
        }
      </div>
    </div>
  );
};

Steps.defaultProps = {
  children: null,
  stepName: null,
};

Steps.propTypes = {
  stepName: Types.string,
  children: Types.oneOfType([Types.node, Types.arrayOf(Types.node)]),
};

const mapStateToProps = state => ({
  stepName: state.routing.locationBeforeTransitions.pathname.split('/').pop(),
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(Steps);
