# react-hig-datepicker

Build a simple date picker component with HIG element and style
- based on react-datepicker https://github.com/Hacker0x01/react-datepicker/

## Demo
demo link: https://ziweiwu.github.io/fusion-hig-prototyping

## Usage Example
```
import DatePicker from 'react-hig-datepicker'

export default class Default extends Component {
  constructor(props) {
    super(props);
    this.state = {
      startDate: undefined,
    };
    this.handleChangeDate = this.handleChangeDate.bind(this);
  }

  handleChangeDate(date) {
    this.setState({ startDate: date });
  }

  render() {
    return (
      <DatePicker
        selected={this.state.startDate}
        onChange={this.handleChangeDate}
      />
    );
  }
}
```
