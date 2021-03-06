import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { Link } from 'react-router';
import { Message } from 'retranslate';

import { logo, Loader } from '../../common';

const Header = ({ user: { name } = {}, loading, onLogout }) => (
  <div className="row">
    <div className="col align-self-start">
      <a href="//tuleva.ee" target="_blank" rel="noopener noreferrer">
        <img src={logo} alt="Tuleva" className="img-responsive brand-logo" />
      </a>
    </div>
    <div className="col align-self-end text-right">
      {
        loading || !name ?
          <Loader className="align-right" /> :
          (
            <div>
              {name}&ensp;&middot;&ensp;
              <button className="btn btn-link p-0 border-0" onClick={onLogout}>
                <Message>log.out</Message>
              </button>
              <br />
              <Link className="btn btn-link p-0 border-0" to="/account">
                <Message>header.my.account</Message>
              </Link>
            </div>
          )
      }
    </div>
    <div className="col-12 my-3 px-0">
      <hr />
    </div>
  </div>
);

const noop = () => null;

Header.defaultProps = {
  user: {},
  loading: false,
  onLogout: noop,
};

Header.propTypes = {
  user: Types.shape({ name: Types.string }),
  loading: Types.bool,
  onLogout: Types.func,
};

export default Header;
