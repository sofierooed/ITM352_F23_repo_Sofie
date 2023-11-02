let day = 11;
let month = "July";
let year = 2001;

let monthKey= {
    "January": 0,
    "February": 3,
    "March": 2,
    "April": 5,
    "May": 0,
    "June": 3,
    "July": 5,
    "August": 1,
    "September": 4,
    "October": 6,
    "November": 2,
    "December": 4
}

function DayOfWeek(day, month, year){
    if(month !== "January" && month !== "Februay"){
        let weekday = year + (Math.floor(year/4)) - (Math.floor(year/100)) + (Math.floor(year/400) + day);
        let monthValue = monthKey[month];
        console.log((weekday + monthValue) % 7)
    }
    else{
        let weekday = (year - 1) + (Math.floor(year/4)) - (Math.floor(year/100)) + (Math.floor(year/400) + day);
        let monthValue = monthKey[month];
        console.log((weekday + monthValue) % 7)
    }
}

DayOfWeek(day, month, year)
