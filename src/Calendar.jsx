import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';
import './Entry.css';
import { getAuditsAll, getAuditors, getDivisions, getSites } from './assets/data/apiData';

const VIEW_MODES = ['monthly', 'weekly', 'daily'];

const buildDateKey = (date) => {
    const yearValue = date.getFullYear();
    const monthValue = String(date.getMonth() + 1).padStart(2, '0');
    const dayValue = String(date.getDate()).padStart(2, '0');
    return `${yearValue}-${monthValue}-${dayValue}`;
};

const getStartOfWeek = (date) => {
    const copy = new Date(date);
    const day = copy.getDay();
    copy.setDate(copy.getDate() - day);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const getStartOfMonth = (date) => {
    const copy = new Date(date.getFullYear(), date.getMonth(), 1);
    copy.setHours(0, 0, 0, 0);
    return copy;
};

const alignDate = (date, mode) => {
    if (mode === 'weekly') return getStartOfWeek(date);
    if (mode === 'monthly') return getStartOfMonth(date);
    return date;
};

const formatShortDate = (date) => date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
const formatLongDate = (date) =>
    date.toLocaleDateString('default', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

const getSiteLabel = (site) => {
    if (!site) return '';
    const city = site.city || '';
    const address = site.address || '';
    if (city && address) {
        return `${city} (${address})`;
    }
    if (city) {
        return city;
    }
    return address || site.siteId;
};

const Calendar = () => {
    const [audits, setAudits] = useState([]);
    const [auditors, setAuditors] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [sites, setSites] = useState([]);
    const [viewMode, setViewMode] = useState('monthly');
    const [viewDate, setViewDate] = useState(() => alignDate(new Date(), 'monthly'));
    const [hoverInfo, setHoverInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            try {
                const [auditData, auditorData, divisionData, siteData] = await Promise.all([
                    getAuditsAll(true),
                    getAuditors(),
                    getDivisions(),
                    getSites()
                ]);
                if (mounted) {
                    setAudits(auditData);
                    setAuditors(auditorData);
                    setDivisions(divisionData);
                    setSites(siteData);
                }
            } catch (error) {
                console.error('Error loading calendar data:', error);
            }
        };
        loadData();
        return () => {
            mounted = false;
        };
    }, []);

    const divisionMap = useMemo(() => {
        const map = {};
        divisions.forEach((division) => {
            if (division.divisionId) {
                map[division.divisionId] = division.divisionName;
            }
        });
        return map;
    }, [divisions]);

    const siteMap = useMemo(() => {
        const map = {};
        sites.forEach((site) => {
            if (site.siteId) {
                map[site.siteId] = getSiteLabel(site);
            }
        });
        return map;
    }, [sites]);

    const auditorMap = useMemo(() => {
        const map = {};
        auditors.forEach((auditor) => {
            if (auditor.auditorId) {
                map[auditor.auditorId] = auditor.auditorName;
            }
        });
        return map;
    }, [auditors]);

    const eventsByDate = useMemo(() => {
        const map = {};
        audits.forEach((audit) => {
            const dateString = audit.expectedStartDate;
            if (!dateString) return;
            const key = dateString.split('T')[0];
            if (!map[key]) map[key] = [];
            const siteIds = Array.isArray(audit.siteIds)
                ? audit.siteIds
                : Array.isArray(audit.siteids)
                    ? audit.siteids
                    : [];
            const additionalIds = Array.isArray(audit.additionalAuditorIds)
                ? audit.additionalAuditorIds
                : [];
            map[key].push({
                ...audit,
                leadName: auditorMap[audit.leadAuditorId] || 'No lead assigned',
                divisionName: (() => {
                    const ids = Array.isArray(audit.divisionId)
                        ? audit.divisionId
                        : audit.divisionId != null
                            ? [audit.divisionId]
                            : [];
                    const names = ids.map((id) => divisionMap[id]).filter(Boolean);
                    return names.length > 0 ? names.join('; ') : 'Unassigned';
                })(),
                siteNames: siteIds.map((id) => siteMap[id]).filter(Boolean),
                additionalAuditorNames: additionalIds.map((id) => auditorMap[id]).filter(Boolean)
            });
        });
        return map;
    }, [audits, auditorMap, divisionMap, siteMap]);

    const monthStart = useMemo(() => getStartOfMonth(viewDate), [viewDate]);
    const year = monthStart.getFullYear();
    const monthIndex = monthStart.getMonth();
    const monthLength = new Date(year, monthIndex + 1, 0).getDate();
    const prevMonthLength = new Date(year, monthIndex, 0).getDate();
    const startDay = monthStart.getDay();

    const monthlyCells = useMemo(() => {
        const output = [];
        for (let index = 0; index < 42; index += 1) {
            const dayOffset = index - startDay + 1;
            let cellDate;
            if (dayOffset <= 0) {
                cellDate = new Date(year, monthIndex - 1, prevMonthLength + dayOffset);
            } else if (dayOffset > monthLength) {
                cellDate = new Date(year, monthIndex + 1, dayOffset - monthLength);
            } else {
                cellDate = new Date(year, monthIndex, dayOffset);
            }
            output.push(cellDate);
        }
        return output;
    }, [year, monthIndex, monthLength, prevMonthLength, startDay]);

    const weeklyDates = useMemo(() => {
        const start = getStartOfWeek(viewDate);
        return Array.from({ length: 7 }, (_, index) => {
            const copy = new Date(start);
            copy.setDate(copy.getDate() + index);
            return copy;
        });
    }, [viewDate]);

    const handleNavigate = (delta) => {
        setViewDate((prev) => {
            if (viewMode === 'weekly') {
                const next = new Date(prev);
                next.setDate(next.getDate() + delta * 7);
                return getStartOfWeek(next);
            }
            if (viewMode === 'daily') {
                const next = new Date(prev);
                next.setDate(next.getDate() + delta);
                return next;
            }
            const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
            return getStartOfMonth(next);
        });
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        setViewDate((prev) => alignDate(prev, mode));
    };

    const handleEventHover = (event, auditEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setHoverInfo({
            audit: auditEvent,
            coords: {
                top: rect.top + window.scrollY + rect.height + 6,
                left: rect.left + window.scrollX
            }
        });
    };

    const clearHoverInfo = () => setHoverInfo(null);

    const renderEventButton = (audit, keyPrefix) => (
        <button
            key={`${keyPrefix}-${audit.scheduleId}`}
            type="button"
            className="calendar-event"
            onClick={() => navigate(`/audit/${audit.scheduleId}`)}
            onMouseEnter={(event) => handleEventHover(event, audit)}
            onMouseLeave={clearHoverInfo}
        >
            <span className="event-id">{audit.scheduleId}</span>
            <span className="event-lead">{audit.leadName}</span>
        </button>
    );

    const renderEventsForDate = (date, limit = 3) => {
        const key = buildDateKey(date);
        const events = eventsByDate[key] || [];
        return events.slice(0, limit).map((event) => renderEventButton(event, key));
    };

    const dailyEvents = useMemo(() => eventsByDate[buildDateKey(viewDate)] || [], [eventsByDate, viewDate]);

    const headerSubtitle = (() => {
        if (viewMode === 'weekly') {
            const start = weeklyDates[0];
            const end = weeklyDates[6];
            return `${formatShortDate(start)} — ${formatShortDate(end)}`;
        }
        if (viewMode === 'daily') {
            return formatLongDate(viewDate);
        }
        const endOfMonth = new Date(year, monthIndex, monthLength);
        return `${formatShortDate(monthStart)} — ${formatShortDate(endOfMonth)}`;
    })();

    const headerTitle = (() => {
        if (viewMode === 'weekly') return 'Weekly View';
        if (viewMode === 'daily') return 'Daily View';
        return monthStart.toLocaleString('default', { month: 'long' });
    })();

    return (
        <div className="entry-page">
            <div className="entry-container">
                <div className="tool-page-header calendar-tool-header">
                    <p className="tool-page-subtitle">Tools · Calendar</p>
                    <h2 className="tool-page-title">Calendar</h2>
                </div>
                <div className="calendar-bubble">
                <div className="calendar-header">
                    <div className="calendar-title">
                        <div className="calendar-season-title">{headerTitle}</div>
                        <div className="calendar-season-subtitle">{headerSubtitle}</div>
                    </div>
                    <div className="calendar-header-actions">
                        <div className="calendar-view-toggle">
                            {VIEW_MODES.map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    className={`view-toggle ${viewMode === mode ? 'active' : ''}`}
                                    onClick={() => handleViewModeChange(mode)}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className="calendar-controls">
                            <button type="button" onClick={() => handleNavigate(-1)} aria-label="Previous">
                                ‹
                            </button>
                            <button type="button" onClick={() => handleNavigate(1)} aria-label="Next">
                                ›
                            </button>
                        </div>
                    </div>
                </div>
                {viewMode === 'monthly' && (
                    <div className="calendar-grid">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="calendar-weekday">
                                {day}
                            </div>
                        ))}
                        {monthlyCells.map((date) => {
                            const isCurrentMonth = date.getMonth() === monthIndex;
                            return (
                                <div
                                    key={buildDateKey(date)}
                                    className={`calendar-cell ${isCurrentMonth ? 'current-month' : 'other-month'}`}
                                >
                                    <div className="calendar-day">{date.getDate()}</div>
                                    <div className="calendar-events">{renderEventsForDate(date)}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {viewMode === 'weekly' && (
                    <div className="weekly-grid">
                        {weeklyDates.map((date) => (
                            <div key={buildDateKey(date)} className="weekly-cell">
                                <div className="weekly-header">
                                    <span className="weekly-day">{date.toLocaleString('default', { weekday: 'short' })}</span>
                                    <span className="weekly-date">{date.getDate()}</span>
                                </div>
                                <div className="weekly-events">{renderEventsForDate(date)}</div>
                            </div>
                        ))}
                    </div>
                )}
                {viewMode === 'daily' && (
                    <div className="daily-list">
                        <div className="daily-summary">
                            <span className="daily-summary-label">Events for today</span>
                            <span className="daily-summary-date">{formatLongDate(viewDate)}</span>
                        </div>
                        <div className="daily-events">
                            {dailyEvents.length === 0 ? (
                                <div className="daily-empty">No audits scheduled for this day.</div>
                            ) : (
                                dailyEvents.slice(0, 8).map((event) => (
                                    <button
                                        key={`daily-${event.scheduleId}`}
                                        type="button"
                                        className="daily-event"
                                        onClick={() => navigate(`/audit/${event.scheduleId}`)}
                                        onMouseEnter={(mouseEvent) => handleEventHover(mouseEvent, event)}
                                        onMouseLeave={clearHoverInfo}
                                    >
                                        <div className="daily-event-top">
                                            <span className="event-id">{event.scheduleId}</span>
                                            <span className="event-title">{event.title}</span>
                                        </div>
                                        <div className="daily-event-bottom">
                                            <span className="event-lead">Lead: {event.leadName}</span>
                                            <span className="event-sites">{event.siteNames.join(', ')}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
                {hoverInfo && (
                    <div
                        className="event-tooltip"
                        style={{ top: hoverInfo.coords.top, left: hoverInfo.coords.left }}
                    >
                        <div className="tooltip-title">{hoverInfo.audit.title || `Audit ${hoverInfo.audit.scheduleId}`}</div>
                        <div className="tooltip-row">
                            <strong>Division:</strong> {hoverInfo.audit.divisionName}
                        </div>
                        <div className="tooltip-row">
                            <strong>Sites:</strong> {hoverInfo.audit.siteNames.length ? hoverInfo.audit.siteNames.join(', ') : 'None'}
                        </div>
                        <div className="tooltip-row">
                            <strong>Additional Auditors:</strong>{' '}
                            {hoverInfo.audit.additionalAuditorNames.length
                                ? hoverInfo.audit.additionalAuditorNames.join(', ')
                                : 'None'}
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
