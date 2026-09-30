import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from './assets/NG.png';
import foeLinks from './config/foeLinks.js';

// Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com
// Icons licensed under CC BY 4.0: https://fontawesome.com/license/free
const NavbarIcon = ({ viewBox, path }) => (
    <svg className="navbar-shortcut-icon" viewBox={viewBox} aria-hidden="true" focusable="false">
        <path fill="currentColor" d={path} />
    </svg>
);

const navbarShortcutIcons = {
    todo: {
        viewBox: '0 0 448 512',
        path: 'M384 32c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32l320 0zM342 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L189.1 315.2 137 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.9 7.5 18.8 7s13.4-4.1 17.5-9.8L347.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z'
    },
    calendar: {
        viewBox: '0 0 448 512',
        path: 'M128 0C110.3 0 96 14.3 96 32l0 32-32 0C28.7 64 0 92.7 0 128l0 48 448 0 0-48c0-35.3-28.7-64-64-64l-32 0 0-32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 32-128 0 0-32c0-17.7-14.3-32-32-32zM0 224L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-192-448 0z'
    },
    metrics: {
        viewBox: '0 0 512 512',
        path: 'M192 80c0-26.5 21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 352c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48l0-352zM0 272c0-26.5 21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 160c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48L0 272zM432 96l32 0c26.5 0 48 21.5 48 48l0 288c0 26.5-21.5 48-48 48l-32 0c-26.5 0-48-21.5-48-48l0-288c0-26.5 21.5-48 48-48z'
    }
};

const Navbar = () => {
    const [openDropdown, setOpenDropdown] = useState(null);

    const handleMouseEnter = (menu) => {
        setOpenDropdown(menu);
    };

    const handleMouseLeave = () => {
        setOpenDropdown(null);
    };

    const foeDropdownItems = [
        { label: foeLinks.metrics.label, path: foeLinks.metrics.url, external: true },
        { label: foeLinks.audits.label, path: '/foe?type=audits' },
        { label: foeLinks.download.label, path: '/foe?type=download' },
        { label: foeLinks.admin.label, path: '/foe/admin' }
    ];

    const dropdownOptions = {
        'Auditing Steps': [
            { label: 'Audit Schedule', path: '/entry?type=schedule' },
            { label: 'Audit Plan', path: '/entry?type=planning' },
            { label: 'Conduct Audit', path: '/entry?type=results' },
            { label: 'Nonconformities', path: '/entry?type=nonconformities' }
        ],
        'Audit Reports': [
            { label: 'Individual Audit Reports', path: '/audit' },
            { label: 'All My Audits', path: '/myaudits' },
            { label: 'Reports', path: '/audit-reports' }
        ],
        'FOE': foeDropdownItems,
        'Tools': [
            { label: 'Admin Menu', path: '/admin' },
            { label: 'My Audit To-Do List', path: '/audit-statuses' },
            { label: 'Calendar', path: '/calendar' },
            { label: 'Metrics', path: '/metrics' },
            { label: 'Risk Analysis', path: '/risk-analysis' }
        ],
        'Help': [
            { label: 'Info/Support', path: '/info-support' },
            { label: 'Submit Improvement', path: '/submit-improvement' },
            { label: 'Request Auditor Access', path: '/request-auditor-access' }
        ]
    };

    return (
        <nav className="navbar">
            <Link className="navbar-left" to="/">
                <img src={logo} alt="NG Logo" className="navbar-logo" />
                <span className="navbar-title">NGAT</span>
            </Link>

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

                <Link to="/audit-statuses" className="icon-button navbar-shortcut" title="My Audit To-Do List" aria-label="My Audit To-Do List">
                    <NavbarIcon {...navbarShortcutIcons.todo} />
                </Link>
                <Link to="/calendar" className="icon-button navbar-shortcut" title="Calendar" aria-label="Calendar">
                    <NavbarIcon {...navbarShortcutIcons.calendar} />
                </Link>
                <Link to="/metrics" className="icon-button navbar-shortcut" title="Metrics" aria-label="Metrics">
                    <NavbarIcon {...navbarShortcutIcons.metrics} />
                </Link>
                <Link to="/" className="icon-button" title="Home">⌂</Link>
            </div>
        </nav>
    );
};

export default Navbar;
