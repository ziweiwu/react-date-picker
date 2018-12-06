import React, { Component } from 'react';
import { render } from 'react-dom';
import Datepicker from '../../src';
import '../../src/datePicker.scss';

class Demo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: undefined,
    };
    this.handleChangeDate = this.handleChangeDate.bind(this);
  }

  handleChangeDate(date) {
    this.setState({
      startDate: date,
    });
  }

  render() {
    return (
      <div>
        <h1>
react-hig-datepicker Demo
        </h1>
        <Datepicker
          selected={this.state.startDate}
          onChange={this.handleChangeDate}
          showClearButton
          label="Select a date"
          instruction="Choose a date"
        />
      </div>
    );
  }
}

render(<Demo />, document.querySelector('#demo'));
