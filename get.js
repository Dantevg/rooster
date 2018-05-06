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

function formatURL(type, user, offset, token){
	var base = "https://citadelcollege.zportal.nl/api/v3/"
	if( type == "user" ){
		return base + "appointments?user=" + user + "&startWeekOffset=" + offset + "&endWeekOffset=" + (offset+1) + "&access_token=" + token
	}else if( type == "class" ){
		return base + "appointments?containsStudentsFromGroupInDepartment=" + user + "&startWeekOffset=" + offset + "&endWeekOffset=" + (offset+1) + "&access_token=" + token
	}else if( type == "location" ){
		return base + "appointments?locationsOfBranch=" + user + "&startWeekOffset=" + offset + "&endWeekOffset=" + (offset+1) + "&access_token=" + token
	}else if( type == "name" ){
		return base + "appointments?user=" + user + "&startWeekOffset=" + offset + "&endWeekOffset=" + (offset+1) + "&access_token=" + token
	}
	
	else if( type == "classes" ){
		return base + "groupindepartments?schoolInSchoolYear=" + departments + "&access_token=" + token
	}else if( type == "locations" ){
		return base + "locationofbranches?schoolInSchoolYear=" + departments + "&access_token=" + token
	}else if( type == "names" ){
		return base + "users?fields=code,prefix,firstName,lastName&isStudent=true&schoolInSchoolYear=" + departments + "&access_token=" + token
	}else if( type == "users" ){
		return base + "users?fields=code&schoolInSchoolYear=" + departments + "&access_token=" + token
	}else if( type == "departments" ){
		return base + "schoolsinschoolyears?access_token=" + token
	}
}

async function getUserID(user, type){
	if( type == "user" ){
		
		if( !$.isEmptyObject(users) ){
			if( users[user] ){
				userName = ""
				return user
			}else{
				// console.log("No such user: " + user)
				return false
			}
		}else{
			try{
				var data = await $.getJSON(formatURL("users", undefined, undefined, token))
				data = data.response.data
				for( var i = 0; i < data.length; i++ ){
					users[data[i].code] = true
				}
				if( users[user] ){
					userName = ""
					return user
				}else{
					// console.log("No such user: " + user)
					return false
				}
			}catch(e){
				console.log( new Error("Web request failed") )
				return false
			}
		}
		
	}else if( type == "class" ){
		
		if( !$.isEmptyObject(classes) ){
			return classes[user]
		}else{
			try{
				var data = await $.getJSON(formatURL("classes", undefined, undefined, token))
				data = data.response.data
				for( var i = 0; i < data.length; i++ ){
					classes[data[i].name.toLowerCase()] = data[i].id
				}
				if( classes[user] ){
					userName = ""
					return classes[user]
				}else{
					// console.log("No such user: " + user)
					return false
				}
			}catch(e){
				console.log( new Error("Web request failed") )
				return false
			}
		}
		
	}else if( type == "location"){
		
		if( !$.isEmptyObject(locations) ){
			return locations[user]
		}else{
			try{
				var data = await $.getJSON(formatURL("locations", undefined, undefined, token))
				data = data.response.data
				for( var i = 0; i < data.length; i++ ){
					locations[data[i].name.toLowerCase()] = data[i].id
				}
				if( locations[user] ){
					userName = ""
					return locations[user]
				}else{
					// console.log("No such location: " + user)
					return false
				}
			}catch(e){
				console.log( new Error("Web request failed") )
				return false
			}
		}
		
	}else if( type == "name" ){
		
		if( !$.isEmptyObject(names) ){
			var name = user.match(/[a-z]+/g)
			if( !name ){ return false };
			var firstName = name[0]
			var surname = name.slice(1).join(" ")
			// var surname = (name[1] ? name[1] : "") + (name[2] ? " "+name[2] : "")
			if( names[firstName] ){
				if( surname ){
					userName = firstName + " " + surname
					return names[firstName][surname]
				}else{
					userName = firstName + " " + Object.keys( names[firstName] )[0]
					return names[firstName][ Object.keys( names[firstName] )[0] ]
				}
			}else{
				// console.log("No such name: " + user)
				return false
			}
		}else{
			try{
				var data = await $.getJSON(formatURL("names", undefined, undefined, token))
				data = data.response.data
				for( var i = 0; i < data.length; i++ ){
					var firstName = data[i].firstName.toLowerCase()
					var prefix = data[i].prefix ? data[i].prefix.toLowerCase()+" " : ""
					var lastName = data[i].lastName.toLowerCase()
					names[firstName] = names[firstName] || {}
					names[firstName][prefix+lastName] = data[i].code
				}
				if( names[user] ){
					userName = firstName + " " + prefix + lastName
					return names[user]
				}else{
					// console.log("No such name: " + user)
					return false
				}
			}catch(e){
				console.log( new Error("Web request failed") )
				return false
			}
		}
		
	}else{
		
		console.log( new Error("No such type: " + type) )
		return false
		
	} // End if type
}


async function checkChange(thisWeek){
	if( offset > -2 ){
		var lastWeek = await get(offset-1)
		for( var i = 0; i < thisWeek.length; i++ ){
			var thisLesson = thisWeek[i]

			for( var j = 0; j < lastWeek.length; j++ ){
				var prevLesson = lastWeek[j]

				// Check if same lesson
				if( prevLesson.startdate.getDay() == thisLesson.startdate.getDay() && prevLesson.startslot == thisLesson.startslot ){
					// Same lesson, check if changed
					if( prevLesson.desc.lokaal != thisLesson.desc.lokaal ){
						thisLesson.locationChanged = true
					}
					if( prevLesson.vak != thisLesson.vak ){
						thisLesson.subjectChanged = true
					}
					break;
				}else if( j == lastWeek.length - 1 ){ // Not the same lesson, last option
					thisLesson.locationChanged = true
					thisLesson.subjectChanged = true
				} // End if same lesson
			} // End for prevLesson
		} // End for thisLesson
		return thisWeek
	}else{
		return thisWeek
	}
}


function removeOldSchedules(){
	var thisWeek = new Date().getWeek()
	for( weekNumber in thisWeek ){
		if( weekNumber + 2 < new Date().getWeek() ){
			localStorage.removeItem(weekNumber)
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


function getOffline(userCode, Offset, Type){
	Offset = Offset || offset
	if( userCode == defaultUser ){
		var offline = localStorage["lessons-"+(new Date().getWeek()+Offset)]
		if( offline != undefined ){
			var data = JSON.parse(offline)
			if( data.date + 3600000 > Date.now() ){
				console.log("Loaded offline schedule ("+Type+": "+user+" ("+userCode+") (default), week: "+Offset+")")
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


async function getOnline(userCode, Offset, Type){
	Offset = Offset || offset
	
	try{
		var data = await $.getJSON(formatURL(Type, userCode, Offset, token))
		var formattedData = format(data.response.data)
		console.log("Loaded online schedule ("+Type+": "+user+" ("+userCode+") (default), week: "+Offset+")")
		if( userCode == defaultUser ){ // Store offline
			localStorage.setItem( "lessons-" + (new Date().getWeek()+Offset), JSON.stringify({date: Date.now(), data: formattedData}) )
		}
		return formattedData
	}catch(e){
		console.log(e.getResponseHeader("status"))
		return false
	}
}


async function updateOffline(userCode, offset, type){
	var data = getOffline(userCode, offset, type)
	if( data ){
		data = await checkChange(data)
		formatSchedule(data)
		lessons[userCode] = lessons[userCode] || []
		lessons[userCode][offset+2] = data
		
		$("span.offline").css("display", "block")
		return true
	}
	return false
}


async function updateOnline(userCode, offset, type){
	var data = await getOnline(userCode, offset, type)
	if( data ){
		data = await checkChange(data)
		formatSchedule(data)
		lessons[userCode] = lessons[userCode] || []
		lessons[userCode][offset+2] = data
		
		$("span.offline").css("display", "none")
	}
}


async function update(User, Offset){
	user = User || user
	offset = Offset || offset
	
	// Check type of user (student/employee, class, location)
	// Student: 	/^\d{3,}$/
	// Employee: 	/^[a-z]{4}$/
	// Class: 		/^\d{1}[a-z]{1}\d{1}$/
	// Location: 	/^[a-z]+[0-9]+[a-z]*$/ or aula, spil, ster_a, ster_b
	if( /^[a-z]+[0-9]+[a-z]*$/.test(user) || user == "aula" || user == "spil" || user == "ster_a" || user == "ster_b" ){
		type = "location"
	}else if( /^\d{1}[a-z]{1}\d{1}$/.test(user) ){
		type = "class"
	}else if( /^\d{3,}$/.test(user) || /^[a-z]{4}$/.test(user) ){
		type = "user"
	}else{
		type = "name"
	}
	
	if( !departments ){
		try{
			var data = await $.getJSON(formatURL("departments", undefined, undefined, token))
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
		}catch(e){
			console.log( new Error("Web request failed") )
			return false
		}
	}
	
	var userCode = await getUserID(user, type)
	showUserName(userName, type)
	if( !userCode ){
		// 4-long names
		if( type == "user" && /^[a-z]{4}$/.test(user) ){
			userCode = await getUserID(user, "name")
			if( userCode ){
				type = "name"
				showUserName(userName, type)
			}else{
				showUserName("", type)
				return false
			}
		}else{
			showUserName("", type)
			return false
		}
	}
	
	if( lessons[userCode] && lessons[userCode][offset+2] ){ // Saved locally
		formatSchedule(lessons[userCode][offset+2])
		if( userCode == defaultUser && localStorage["lessons-"+(new Date().getWeek()+offset)] ){
			$("span.offline").css("display", "block")
		}else{
			$("span.offline").css("display", "none")
		}
	}else{
		if( !await updateOffline(userCode, offset, type) ){
			updateOnline(userCode, offset, type)
		}
	}
	
	removeOldSchedules()
}


async function get(offset){
	if( /^[a-z]+[0-9]+[a-z]*/.test(user) || user == "aula" || user == "spil" || user == "ster_a" || user == "ster_b" ){
		type = "location"
	}else if( /^\d{1}[a-z]{1}\d{1}/.test(user) ){
		type = "class"
	}else if( /^\d{3,}/.test(user) || /^[a-z]{4}/.test(user) ){
		type = "user"
	}else{
		type = "name"
	}
	
	var userCode = await getUserID(user, type)
	if( !userCode ){
		// 4-long names
		if( type == "user" && /^[a-z]{4}$/.test(user) ){
			userCode = await getUserID(user, "name")
			if( userCode ){
				type = "name"
			}else{
				return false
			}
		}else{
			return false
		}
	}
	
	if( lessons[userCode] && lessons[userCode][offset+2] ){ // Saved locally
		return lessons[userCode][offset+2]
	}
	
	lessons[userCode] = lessons[userCode] || []
	var data = getOffline(userCode, offset, type)
	
	if( data ){
		lessons[userCode][offset+2] = data
		return data
	}else{
		// Get online schedule
		var data = await getOnline(userCode, offset, type)
		if( data ){
			lessons[userCode][offset+2] = data
			return data
		}
	}
}