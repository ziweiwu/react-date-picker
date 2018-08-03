# react-hig-datepicker

Build a simple date picker component with HIG element and style 
- based on react-datepicker https://github.com/Hacker0x01/react-datepicker
- based on HIG components library https://github.com/Autodesk/hig

## Demo
demo link: https://ziweiwu.github.io/fusion-hig-prototyping

## Install the package
```
yarn add react-hig-datepicker
```

## Usage Example
```
import DatePicker from 'react-hig-datepicker'
import 'react-hig-datepicker/lib/datePicker.css';

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
        onChange={this.handleChangeDate}
        selected={this.state.startDate}
      />
    );
  }
}
```
### More details on props 
Please see this [link](/src/README.md)

