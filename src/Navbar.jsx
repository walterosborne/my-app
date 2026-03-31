import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from './assets/NG.png';

const Navbar = () => {
    const [openDropdown, setOpenDropdown] = useState(null);

    const handleMouseEnter = (menu) => {
        setOpenDropdown(menu);
    };

    const handleMouseLeave = () => {
        setOpenDropdown(null);
    };

    const dropdownOptions = {
        'Auditing Steps': [
            { label: 'Audit Schedule', path: '/entry?type=schedule' },
            { label: 'Audit Plan', path: '/entry?type=planning' },
            { label: 'Conduct Audit', path: '/entry?type=results' },
            { label: 'Nonconformities', path: '/entry?type=nonconformaties' }
        ],
        'Audit Reports': [
            { label: 'Individual Audit Reports', path: '/audit' },
            { label: 'All My Audits', path: '/myaudits' },
            { label: 'Reports', path: '/audit-reports' }
        ],
        'FOE': [
            { label: 'Metrics', path: 'https://www.yahoo.com', external: true },
            { label: 'Audits', path: '/foe?type=audits' },
            { label: 'Download Audit Info', path: '/foe?type=download' },
            { label: 'Admin Menu', path: '/foe?type=admin' }
        ],
        'Tools': [
            { label: 'Admin Menu', path: '/admin' },
            { label: 'Audit Statuses', path: '/audit-statuses' },
            { label: 'Calendar', path: '/calendar' },
            { label: 'Metrics', path: '/metrics' },
            { label: 'Risk Analysis', path: '/risk-analysis' }
        ],
        'Help': [
            { label: 'Info/Support', path: '/info-support' },
            { label: 'Request Auditor Access', path: '/request-auditor-access' }
        ]
    };

    return (
        <nav className="navbar">
            <a className="navbar-left" href="/">
                <img src={logo} alt="NG Logo" className="navbar-logo" />
                <span className="navbar-title">NGAT</span>
            </a>

            <div className="navbar-right">
                <div className="nav-item-wrapper" onMouseEnter={() => handleMouseEnter('auditing')} onMouseLeave={handleMouseLeave}>
                    <div className="nav-item">
                        <button className="nav-button">
                            Auditing Steps
                        </button>
                        {openDropdown === 'auditing' && dropdownOptions['Auditing Steps'].length > 0 && (
                            <div className="dropdown-menu">
                                {dropdownOptions['Auditing Steps'].map((item, index) => (
                                    item.external ? (
                                        <a key={index} href={item.path} className="dropdown-item" target="_blank" rel="noreferrer">
                                            {item.label}
                                        </a>
                                    ) : (
                                        <Link key={index} to={item.path} className="dropdown-item">{item.label}</Link>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="nav-item-wrapper" onMouseEnter={() => handleMouseEnter('reports')} onMouseLeave={handleMouseLeave}>
                    <div className="nav-item">
                        <button className="nav-button">
                            Audit Reports
                        </button>
                        {openDropdown === 'reports' && dropdownOptions['Audit Reports'].length > 0 && (
                            <div className="dropdown-menu">
                                {dropdownOptions['Audit Reports'].map((item, index) => (
                                    item.external ? (
                                        <a key={index} href={item.path} className="dropdown-item" target="_blank" rel="noreferrer">
                                            {item.label}
                                        </a>
                                    ) : (
                                        <Link key={index} to={item.path} className="dropdown-item">{item.label}</Link>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="nav-item-wrapper" onMouseEnter={() => handleMouseEnter('foe')} onMouseLeave={handleMouseLeave}>
                    <div className="nav-item">
                        <button className="nav-button">
                            FOE
                        </button>
                        {openDropdown === 'foe' && dropdownOptions['FOE'].length > 0 && (
                            <div className="dropdown-menu">
                                {dropdownOptions['FOE'].map((item, index) => (
                                    item.external ? (
                                        <a key={index} href={item.path} className="dropdown-item" target="_blank" rel="noreferrer">
                                            {item.label}
                                        </a>
                                    ) : (
                                        <Link key={index} to={item.path} className="dropdown-item">{item.label}</Link>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="nav-item-wrapper" onMouseEnter={() => handleMouseEnter('tools')} onMouseLeave={handleMouseLeave}>
                    <div className="nav-item">
                        <button className="nav-button">
                            Tools
                        </button>
                        {openDropdown === 'tools' && dropdownOptions['Tools'].length > 0 && (
                            <div className="dropdown-menu">
                                {dropdownOptions['Tools'].map((item, index) => (
                                    item.external ? (
                                        <a key={index} href={item.path} className="dropdown-item" target="_blank" rel="noreferrer">
                                            {item.label}
                                        </a>
                                    ) : (
                                        <Link key={index} to={item.path} className="dropdown-item">{item.label}</Link>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="nav-item-wrapper" onMouseEnter={() => handleMouseEnter('help')} onMouseLeave={handleMouseLeave}>
                    <div className="nav-item">
                        <button className="nav-button">
                            Help
                        </button>
                        {openDropdown === 'help' && dropdownOptions['Help'].length > 0 && (
                            <div className="dropdown-menu">
                                {dropdownOptions['Help'].map((item, index) => (
                                    item.external ? (
                                        <a key={index} href={item.path} className="dropdown-item" target="_blank" rel="noreferrer">
                                            {item.label}
                                        </a>
                                    ) : (
                                        <Link key={index} to={item.path} className="dropdown-item">{item.label}</Link>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Link to="/" className="icon-button" title="Home">⌂</Link>
            </div>
        </nav>
    );
};

export default Navbar;
