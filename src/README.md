# Props of React-hig-datepicker 

Date picker allows user to easily input a date or a date range

| property  | propType   | required  | default  |  description  |
|---|---|---|---|---|
| closeOnSelect | bool  |   | True  | Close the calender popper after a date is selected  |
| dateFormat    | string   |    | "MM/DD/YYYY"  | Set the date format display in the input field   |
| disable   | bool     |   | False  | Disable date picker    |
| filter  | func  |   |  | Allows filter of dates to be selected |
| fixedHeight   | bool   |   |  true | Whether calender height is fixed or flexible with days in a month  |
| focused   | bool  |   | true  | Control the focus state of input field |  
| id   | string  |   |   | Specify an id for the input field |  
| instruction  | string  |   |   | Display an instruction below the input field   |
| label   | string  |   |   | Display a label above the input field |
| locale  | string |   | "en-us"  | Specify the language locale of date picker  |
| maxDate  | Moment object |   |  | Largest date that user can select   |
| minDate  | Moment object |   |   | Smallest date that user can select |
| onChange  | func   |   |   |    Function to call  when date input is changed |
| showClearButton  | bool  |   | False  | Display a close button to clear input field |
| showIcon  | bool  |   | true  | Whether to display a calender to the left of input field |
| showInstruction  | bool  |   | false  | Whether to display instruction text  |
| showLabel  | bool  |   | true  |  Whether to display label text  |


