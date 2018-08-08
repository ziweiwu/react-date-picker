import React from "react";
import PropTypes from "prop-types";
import Icon from "@hig/icon";
import ReactDatePicker from "react-datepicker";
import { TextFieldPresenter } from "@hig/text-field";
import "@hig/text-field/build/index.css";

export default class DatePicker extends React.Component {
  static propTypes = {
    adjustDateOnChange: PropTypes.bool,
    closeOnSelect: PropTypes.bool,
    dateFormat: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    dateFormatCalendar: PropTypes.string,
    dayClassName: PropTypes.func,
    disabled: PropTypes.bool,
    endDate: PropTypes.object,
    excludeDates: PropTypes.array,
    filterDate: PropTypes.func,
    fixedHeight: PropTypes.bool,
    focused: PropTypes.bool,
    highlightDates: PropTypes.array,
    id: PropTypes.string,
    includeDates: PropTypes.array,
    instruction: PropTypes.string,
    label: PropTypes.string,
    locale: PropTypes.string,
    maxDate: PropTypes.object,
    minDate: PropTypes.object,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    selected: PropTypes.object,
    selectsEnd: PropTypes.bool,
    selectsStart: PropTypes.bool,
    showClearButton: PropTypes.bool,
    showIcon: PropTypes.bool,
    showInstruction: PropTypes.bool,
    showLabel: PropTypes.bool,
    startDate: PropTypes.object,
    startOpen: PropTypes.bool,
    title: PropTypes.string
  };

  static defaultProps = {
    closeOnSelect: true,
    disabled: false,
    fixedHeight: true,
    focused: undefined,
    showClearButton: false,
    showIcon: true,
    showInstruction: false,
    showLabel: true
  };

  render() {
    const props = this.props;
    const calenderIcon = <Icon nameOrSVG="calendar" />;
    const showIcon = this.props.showIcon ? calenderIcon : undefined;
    return (
      <ReactDatePicker
        {...props}
        calender
        className="hig__text-field-v1__input"
        id="hig__date-picker"
        isClearable={false}
        readOnly
        ref={node => (this.node = node)}
        shouldCloseOnSelect={props.closeOnSelect}
        showMonthDropdown={false}
        showMonthYearDropdown={false}
        showTimeSelect={false}
        showYearDropdown={false}
        withPortal={false}
        // use hig text field as inputField
        // use ref to allow the use clear button in text field component
        customInput={
          <TextFieldPresenter
            disabled
            focused={props.focused}
            icon={showIcon}
            id={props.id}
            instructions={props.showInstruction ? props.instruction : undefined}
            label={props.showLabel ? props.label : undefined}
            onBlur={null}
            onClearButtonClick={() => {
              this.node.clear();
            }}
            onFocus={null}
            placeholder={props.placeholder}
            readOnly
            showClearButton={props.showClearButton}
          />
        }
        // calender popper settings
        popperPlacement="bottom-start"
        popperModifiers={{
          // adjust position of calender popper, (horizontal, vertical)
          offset: {
            enabled: true,
            offset: "0px, 0px"
          },
          flip: {
            enabled: false
          },
          preventOverflow: {
            enabled: true,
            escapeWithReference: false
          }
        }}
      />
    );
  }
}

