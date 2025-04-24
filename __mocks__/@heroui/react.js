module.exports = {
  Button: ({ children, onClick, isLoading, ...props }) => ({ 
    type: "button", 
    props: { 
      onClick, 
      isLoading,
      ...props, 
      children: isLoading ? "Loading..." : children 
    } 
  }),
  Input: ({ label, type, value, onChange, errorMessage, isInvalid, ...props }) => ({
    type: "input",
    props: {
      label,
      type,
      value,
      onChange,
      errorMessage,
      isInvalid,
      ...props
    }
  })
};