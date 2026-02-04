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
export { customStyles };