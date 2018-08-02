import React from 'react';
import PropTypes from "prop-types";
import Icon from "@hig/icon";
import {TextFieldPresenter} from '@hig/text-field';
import '@hig/text-field/build/index.css';
import ReactDatePicker from 'react-datepicker';

export default class DatePicker extends React.Component {
  static propTypes = {
    adjustDateOnChange: PropTypes.bool,
    dateFormatCalendar: PropTypes.string,
    dayClassName: PropTypes.func,
    disabled: PropTypes.bool,
    endDate: PropTypes.object,
    focused: PropTypes.bool,
    highlightDates: PropTypes.array,
    id: PropTypes.string,
    locale: PropTypes.string,
    maxDate: PropTypes.object,
    minDate: PropTypes.object,
    onChange: PropTypes.func,
    selected: PropTypes.object,
    selectsEnd: PropTypes.bool,
    selectsStart: PropTypes.bool,
    startDate: PropTypes.object,
    startOpen: PropTypes.bool,
    title: PropTypes.string,
    todayButton: PropTypes.string,
    shouldCloseOnSelect: PropTypes.bool,
    readOnly: PropTypes.bool,
    showIcon: PropTypes.bool,
    instruction: PropTypes.string,
    showInstruction: PropTypes.bool,
    label: PropTypes.string,
    showLabel: PropTypes.bool,
    fixedHeight: PropTypes.bool,
    placeholder: PropTypes.string,
    showClearButton: PropTypes.bool,
    excludeDates: PropTypes.array,
    filterDate: PropTypes.func,
    dateFormat: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    includeDates: PropTypes.array,
    closeOnSelect: PropTypes.bool
  };

  static defaultProps = {
    focused: true,
    shouldCloseOnSelect: true,
    disabled: false,
    showIcon: true,
    label: undefined,
    showLabel: true,
    instruction: undefined,
    showInstruction: false,
    fixedHeight: true,
    showClearButton: false,
    today: true,
    closeOnSelect:true,
  };

  render() {
    const props = this.props;
    const calenderIcon = <Icon nameOrSVG="calendar"/>;
    const showIcon = this.props.showIcon ? calenderIcon : undefined;
    return (<ReactDatePicker
      {...props}
      className="hig__text-field-v1__input"
      id="hig__date-picker"
      ref={node => this.node = node}
      readOnly
      calender
      shouldCloseOnSelect={props.closeOnSelect}
      showMonthYearDropdown={false}
      showMonthDropdown={false}
      showYearDropdown={false}
      showTimeSelect={false}
      withPortal={false}
      isClearable={false}
      // use hig text field as inputField
      // use ref to allow the use clear button in text field component
      customInput={
        <TextFieldPresenter
          id={props.id}
          focused={props.focused}
          readOnly
          disabled
          placeholder={props.placeholder}
          instructions={props.showInstruction ? props.instruction : undefined}
          label={props.showLabel ? props.label : undefined}
          icon={showIcon}
          onFocus={null}
          onBlur={null}
          showClearButton={props.showClearButton}
          onClearButtonClick={() => {
            this.node.clear();
          }}
        />}

      // calender popper settings
      popperPlacement="bottom-start"
      popperModifiers={{
        // adjust position of calender popper, (horizontal, vertical)
        offset: {
          enabled: true,
          offset: '0px, 0px',
        },
        flip: {
          enabled: false,
        },
        preventOverflow: {
          enabled: true,
          escapeWithReference: false,
        },
      }}
    />);
  }
}

