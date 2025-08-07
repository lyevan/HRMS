import React from "react";

const Select = ({
  icon,
  label,
  name,
  required = false,
  onChange,
  options = [],
  value = "",
}) => {
  return (
    <section className="flex flex-col gap-2">
      <span className="label-text">
        {!required ? (
          label
        ) : (
          <>
            {label} <span className="text-error">*</span>
          </>
        )}
      </span>
      <label className="select text-neutral pl-3 focus-within:ring-none focus-within:outline-none">
        {icon && (
          <span className="flex text-base-content items-center pr-2 z-50 border-r border-neutral">
            {icon}
          </span>
        )}{" "}
        <select
          className="grow validator text-base-content"
          name={name}
          required={required}
          onChange={onChange}
          value={value}
        >
          <option disabled value={""}>
            {`Choose ${label.toLowerCase()}`}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
};

export default Select;
