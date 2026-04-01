const customStyles = {
    control: (provided) => ({
        ...provided, // Keeps previous styles
        width: "100%",
        borderRadius: "8px",
        textAlign: 'left',
        backgroundColor: "whitesmoke",
    }),
    option: (provided, state) => ({
        ...provided,
        color: "black",
        backgroundColor: (state.isSelected ? "grey" : "white")

    })

}

const adminSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        width: "100%",
        minHeight: "54px",
        borderRadius: "12px",
        borderColor: state.isFocused ? "#94a3b8" : "#ced4da",
        boxShadow: "none",
        backgroundColor: "#ffffff",
        fontSize: "0.95rem",
        fontFamily: "'Source Sans Pro', system-ui, sans-serif",
        color: "#0f172a",
        "&:hover": {
            borderColor: "#94a3b8"
        }
    }),
    valueContainer: (provided) => ({
        ...provided,
        padding: "0 0.9rem"
    }),
    placeholder: (provided) => ({
        ...provided,
        color: "#94a3b8"
    }),
    singleValue: (provided) => ({
        ...provided,
        color: "#0f172a"
    }),
    input: (provided) => ({
        ...provided,
        color: "#0f172a"
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: "12px",
        overflow: "hidden"
    }),
    option: (provided, state) => ({
        ...provided,
        color: "#0f172a",
        backgroundColor: state.isSelected ? "#e2e8f0" : state.isFocused ? "#f8fafc" : "#ffffff"
    }),
    multiValue: (provided) => ({
        ...provided,
        backgroundColor: "#e2e8f0",
        borderRadius: "999px"
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        color: "#0f172a",
        paddingLeft: "0.55rem",
        paddingRight: "0.3rem"
    }),
    multiValueRemove: (provided) => ({
        ...provided,
        borderRadius: "999px",
        color: "#475569",
        ":hover": {
            backgroundColor: "#cbd5e1",
            color: "#0f172a"
        }
    }),
    indicatorSeparator: (provided) => ({
        ...provided,
        backgroundColor: "#e2e8f0"
    }),
    clearIndicator: (provided) => ({
        ...provided,
        color: "#64748b",
        ":hover": {
            color: "#0f172a"
        }
    }),
    dropdownIndicator: (provided) => ({
        ...provided,
        color: "#64748b",
        ":hover": {
            color: "#0f172a"
        }
    })
};

const padDatePart = (value) => String(value).padStart(2, "0");

const getDateParts = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return {
            year: value.getFullYear(),
            month: value.getMonth() + 1,
            day: value.getDate()
        };
    }

    const rawValue = String(value).trim();
    const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) {
        return {
            year: Number(dateOnlyMatch[1]),
            month: Number(dateOnlyMatch[2]),
            day: Number(dateOnlyMatch[3])
        };
    }

    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) return null;
    return {
        year: parsed.getFullYear(),
        month: parsed.getMonth() + 1,
        day: parsed.getDate()
    };
};

const parseCalendarDate = (value) => {
    const parts = getDateParts(value);
    if (!parts) return null;
    return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
};

const formatDateForInput = (value) => {
    const parts = getDateParts(value);
    if (!parts) return '';
    return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
};

const formatDateForDisplay = (value) => {
    const parts = getDateParts(value);
    if (!parts) return '';
    return `${padDatePart(parts.month)}-${padDatePart(parts.day)}-${parts.year}`;
};

const formatMonthValue = (value) => {
    const parts = getDateParts(value);
    if (!parts) return '';
    return `${parts.year}-${padDatePart(parts.month)}`;
};

export {
    customStyles,
    adminSelectStyles,
    getDateParts,
    parseCalendarDate,
    formatDateForInput,
    formatDateForDisplay,
    formatMonthValue
};
