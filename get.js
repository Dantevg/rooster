function Lesson(data){
	this.startdate = new Date(data.start * 1000)
	this.starttime = this.startdate.getHours() + this.startdate.getMinutes() / 60
	this.startslot = data.startTimeSlot
	
	this.enddate = new Date(data.end * 1000)
	this.endtime = this.enddate.getHours() + this.enddate.getMinutes() / 60
	this.endslot = data.endTimeSlot
	
	this.day = this.startdate.getDay()
	this.size = this.endtime - this.starttime
	
	this.desc = {}
	this.desc.vak = data.subjects.join(", ")
	this.desc.klas = data.groups.join(", ")
	this.desc.lokaal = data.locations.join(", ")
	this.desc.opmerking = data.remark
	this.desc.veranderbericht = data.changeDescription
	this.desc.type = data.type
	
	this.desc.docenten = ""
	for( var i = 0; i < data.teachers.length; i++ ){
		if( i != 0 ){ this.desc.docenten += ", " };
		this.desc.docenten += "<a href>" + data.teachers[i] + "</a>"
	}
	
	this.cancelled = data.cancelled
	this.locationChanged = false
	this.subjectChanged = false
}

function formatScheduleURL(options){
	var base = "https://citadelcollege.zportal.nl/api/v3/"
	if( options.scheduleFor.type == "student" || options.scheduleFor.type == "employee" ){
		return base + "appointments?user=" + options.scheduleFor.id + "&startWeekOffset=" + options.offset + "&endWeekOffset=" + (options.offset+1) + "&access_token=" + token
	}else if( options.scheduleFor.type == "class" ){
		return base + "appointments?containsStudentsFromGroupInDepartment=" + options.scheduleFor.id + "&startWeekOffset=" + options.offset + "&endWeekOffset=" + (options.offset+1) + "&access_token=" + token
	}else if( options.scheduleFor.type == "location" ){
		return base + "appointments?locationsOfBranch=" + options.scheduleFor.id + "&startWeekOffset=" + options.offset + "&endWeekOffset=" + (options.offset+1) + "&access_token=" + token
	}else if( options.scheduleFor.type == "name" ){
		return base + "appointments?user=" + options.scheduleFor.id + "&startWeekOffset=" + options.offset + "&endWeekOffset=" + (options.offset+1) + "&access_token=" + token
	}
}

function formatDataURL(type){
	var base = "https://citadelcollege.zportal.nl/api/v3/"
	if( type == "classes" ){
		return base + "groupindepartments?schoolInSchoolYear=" + departments + "&access_token=" + token
	}else if( type == "locations" ){
		return base + "locationofbranches?schoolInSchoolYear=" + departments + "&access_token=" + token
	}else if( type == "students" ){
		return base + "users?fields=code,prefix,firstName,lastName&isStudent=true&schoolInSchoolYear=" + departments + "&access_token=" + token
	}else if( type == "employees" ){
		return base + "users?fields=code,prefix,lastName&isEmployee=true&schoolInSchoolYear=" + departments + "&access_token=" + token
	}else if( type == "departments" ){
		return base + "schoolsinschoolyears?access_token=" + token
	}
}

async function getUser(input){
	input = (typeof input == "string") ? input.toLowerCase() : ""
	if( input == "" ){
		return await getUser(defaultUser)
	}
	
	if( $.isEmptyObject(users) ){
		await getUsers()
	}
	
	if( $.isEmptyObject(users) ){
		console.log( new Error("Web request failed") )
		return false
	}
	
	if( users[input] ){
		// Student/employee code, first name, class, location
		return users[input][0]
	}else{
		// Full name
		var name = input.match(/[a-z]+/g)
		if( !name ){ return false };
		var firstName = name[0]
		var lastName = name.slice(1).join(" ")
		// var lastName = (name[1] ? name[1] : "") + (name[2] ? " "+name[2] : "")
		if( users[firstName] ){
			for( var i = 0; i < users[firstName].length; i++ ){
				if( users[firstName][i].lastName == lastName ){
					return users[firstName][i]
				}
			}
			return users[firstName][0]
		}else{
			return false
		}
	}
}

async function getUsers(){
	// Offline
	if( localStorage.users ){
		var offlineUsers = JSON.parse(localStorage.users)
		if( offlineUsers.date + 604800000 > Date.now() ){ // Newer than 1 week
			users = offlineUsers.data
			return true
		}
	}
	
	// Online
	var students = async function(){
		var data = await $.getJSON(formatDataURL("students"))
		data = data.response.data
		for( var i = 0; i < data.length; i++ ){
			var firstName = data[i].firstName.toLowerCase()
			var lastName = data[i].prefix ? data[i].prefix.toLowerCase()+" " : ""
			lastName += data[i].lastName.toLowerCase()
			
			var about = {
				type: "student",
				firstName: firstName,
				lastName: lastName,
				name: firstName + " " + lastName,
				id: data[i].code
			}
			
			users[ data[i].code ] = users[ data[i].code ] || []
			users[ data[i].code ].push(about)
			
			users[firstName] = users[firstName] || []
			users[firstName].push(about)
		}
	}
	
	var employees = async function(){
		var data = await $.getJSON(formatDataURL("employees"))
		data = data.response.data
		for( var i = 0; i < data.length; i++ ){
			var lastName = data[i].prefix ? data[i].prefix.toLowerCase()+" " : ""
			lastName += data[i].lastName ? data[i].lastName.toLowerCase() : ""
			
			var about = {
				type: "employee",
				lastName: lastName,
				name: lastName,
				id: data[i].code
			}
			
			users[ data[i].code ] = users[ data[i].code ] || []
			users[ data[i].code ].push(about)
			users[lastName] = users[lastName] || []
			users[lastName].push(about)
		}
	}
	
	var locations = async function(){
		var data = await $.getJSON(formatDataURL("locations"))
		data = data.response.data
		for( var i = 0; i < data.length; i++ ){
			users[data[i].name.toLowerCase()] = users[data[i].name.toLowerCase()] || []
			users[data[i].name.toLowerCase()].push({
				type: "location",
				name: data[i].name.toLowerCase(),
				id: data[i].id
			})
		}
	}
	
	var classes = async function(){
		var data = await $.getJSON(formatDataURL("classes"))
		data = data.response.data
		for( var i = 0; i < data.length; i++ ){
			users[data[i].name.toLowerCase()] = users[data[i].name.toLowerCase()] || []
			users[data[i].name.toLowerCase()].push({
				type: "class",
				name: data[i].name.toLowerCase(),
				id: data[i].id
			})
		}
	}
	
	await Promise.all([ students(), employees(), locations(), classes() ])
	localStorage.setItem( "users", JSON.stringify({date: Date.now(), data: users}) )
}

async function getDepartments(){
	// Offline
	if( localStorage.departments ){
		var offlineDepartments = JSON.parse(localStorage.departments)
		if( offlineDepartments.date + 2419200000 > Date.now() ){ // Newer than 4 weeks
			departments = offlineDepartments.data
			return true
		}
	}
	
	// Online
	try{
		var data = await $.getJSON(formatDataURL("departments"))
		var data = data.response.data
		var d = new Date()
		var yearCode = d.getFullYear()
		if( d.getMonth() < 6 ){
			yearCode--
		}
		for( var i = 0; i < data.length; i++ ){
			if( data[i].year == yearCode ){
				departments += data[i].id + ","
			}
		}
		departments = departments.slice(0, -1) // Remove last ","
		localStorage.setItem( "departments", JSON.stringify({date: Date.now(), data: departments}) )
	}catch(e){
		console.log( new Error("Web request failed") )
		return false
	}
}

// TODO: Fix
async function checkChange(thisWeek, options){
	if( options.offset <= -2 ){
		return thisWeek
	}
	
	var getOptions = Object.assign({}, options)
	getOptions.offset -= 1
	var lastWeek = await get(getOptions)
	
	for( var i = 0; i < thisWeek.length; i++ ){
		var thisLesson = thisWeek[i]

		for( var j = 0; j < lastWeek.length; j++ ){
			var prevLesson = lastWeek[j]

			// Check if lesson on same location (same lesson)
			if( prevLesson.startdate.getDay() == thisLesson.startdate.getDay() && prevLesson.startslot == thisLesson.startslot ){
				// Same lesson, check if changed
				if( prevLesson.desc.lokaal != thisLesson.desc.lokaal ){
					thisLesson.locationChanged = true
				}
				if( prevLesson.vak != thisLesson.vak ){
					thisLesson.subjectChanged = true
				}
				break;
			}else if( j == lastWeek.length - 1 ){ // Not the same lesson, last option (new lesson)
				thisLesson.locationChanged = true
				thisLesson.subjectChanged = true
			} // End if same lesson
		} // End for prevLesson
	} // End for thisLesson
	return thisWeek
}


function removeOldSchedules(){
	for( key in localStorage ){
		if( key.substring(0,7) == "lessons" ){
			var weekNumber = Number( key.substring(8) )
			if( weekNumber != NaN && weekNumber + 2 < new Date().getWeek() ){
				localStorage.removeItem(key)
			}
		}
	}
}


function format(data){
	var lessons = []
	for( var i = 0; i < data.length; i++ ){
		lessons.push( new Lesson(data[i]) )
	}
	return lessons
}


function getOffline(options){
	if( options.scheduleFor.id == defaultUser ){
		var offline = localStorage["lessons-"+(new Date().getWeek()+options.offset)]
		if( offline != undefined ){
			var data = JSON.parse(offline)
			if( data.date + 3600000 > Date.now() ){
				console.log("Loaded offline schedule ("+options.scheduleFor.type+": "+options.scheduleFor.name+" ("+options.scheduleFor.id+") (default), week: "+options.offset+")")
				data = data.data
				for( var i = 0; i < data.length; i++ ){
					data[i].startdate = new Date(data[i].startdate)
					data[i].enddate = new Date(data[i].enddate)
				}
				return data
			}
		}
	}
	return false
}


async function getOnline(options){
	try{
		var data = await $.getJSON(formatScheduleURL(options))
		var formattedData = format(data.response.data)
		console.log("Loaded online schedule ("+options.scheduleFor.type+": "+options.scheduleFor.name+" ("+options.scheduleFor.id+") (default), week: "+options.offset+")")
		if( options.scheduleFor.id == defaultUser ){ // Store offline
			localStorage.setItem( "lessons-" + (new Date().getWeek()+options.offset), JSON.stringify({date: Date.now(), data: formattedData}) )
		}
		return formattedData
	}catch(e){
		console.log(e, e.getResponseHeader("status"))
		return false
	}
}


async function updateOffline(options){
	var data = getOffline(options)
	if( data ){
		data = await checkChange(data, options)
		formatSchedule(data)
		lessons[options.scheduleFor.id] = lessons[options.scheduleFor.id] || []
		lessons[options.scheduleFor.id][options.offset+2] = data
		
		$("span.offline").css("display", "block")
		return true
	}
	return false
}


async function updateOnline(options){
	var data = await getOnline(options)
	if( data ){
		data = await checkChange(data, options)
		formatSchedule(data)
		lessons[options.scheduleFor.id] = lessons[options.scheduleFor.id] || []
		lessons[options.scheduleFor.id][options.offset+2] = data
		
		$("span.offline").css("display", "none")
	}
}


async function update(options){
	if( !options.scheduleFor ){
		return false
	}
	if( lessons[options.scheduleFor.id] && lessons[options.scheduleFor.id][options.offset+2] ){ // Saved locally
		formatSchedule(lessons[options.scheduleFor.id][options.offset+2])
		if( options.scheduleFor.id == defaultUser && localStorage["lessons-"+(new Date().getWeek()+options.offset)] ){
			$("span.offline").css("display", "block")
		}else{
			$("span.offline").css("display", "none")
		}
	}else{
		if( !await updateOffline(options) ){
			updateOnline(options)
		}
	}
	
	removeOldSchedules()
}


async function get(options){
	if( lessons[options.scheduleFor.id] && lessons[options.scheduleFor.id][options.offset+2] ){ // Saved locally
		return lessons[options.scheduleFor.id][options.offset+2]
	}
	
	// Get offline schedule
	lessons[options.scheduleFor.id] = lessons[options.scheduleFor.id] || []
	var data = getOffline(options)
	
	if( data ){
		lessons[options.scheduleFor.id][options.offset+2] = data
		return data
	}else{
		// Get online schedule
		var data = await getOnline(options)
		if( data ){
			lessons[options.scheduleFor.id][options.offset+2] = data
			return data
		}
	}
}