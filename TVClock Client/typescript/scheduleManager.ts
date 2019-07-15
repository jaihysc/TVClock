//Generate time list
let timetable = $("#view-schedule-timetable");
//AM
for (let i = 1; i <= 12; ++i) {
    timeTableAppend(i + " AM");
}
//PM
for (let i = 1; i <= 12; ++i) {
    timeTableAppend(i + " PM");
}

function timeTableAppend(hour: string) {
    timetable.append(" <li class=\"list-group-item-darker list-group-flush list-time-item\"> <div class=\"row\"> <div class=\"col-2\"> <p class=\"\">" + hour + "</p> </div> <div class=\"col-10\"> <p class=\"\">Plant tomato trees</p> </div> </div> </li>")
}