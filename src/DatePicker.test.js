import React from 'react';
import { shallow } from 'enzyme';
import moment from 'moment';
import DatePicker from './index';

describe('DatePicker', () => {
  // snapshot testing
  test('Snapshot tests regular view', () => {
    const wrapper = shallow(<DatePicker selected={moment('2017-09-15 09:30:00')} />);
    expect(wrapper).toMatchSnapshot();
  });

  test('Snapshot tests disabled view', () => {
    const wrapper = shallow(<DatePicker selected={moment('2017-09-15 09:30:00')} disabled />);
    expect(wrapper).toMatchSnapshot();
  });

  test('Snapshot tests calender Popper', () => {
    const wrapper = shallow(<DatePicker selected={moment('2017-09-15 09:30:00')} hidePopper={false} />);
    expect(wrapper).toMatchSnapshot();
  });

  // test interactions
});
