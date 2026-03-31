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

export { customStyles, adminSelectStyles };
