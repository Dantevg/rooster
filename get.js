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
	}else if( type == "departments" ){
		return base + "schoolsinschoolyears?access_token=" + token
	}
}

function getUserID(user, type){
	return new Promise(function(resolve, reject){
		if( type == "user" ){
			resolve(user)
		}else if( type == "class" ){
			if( !$.isEmptyObject(classes) ){
				resolve(classes[user])
			}else{
				var request = $.getJSON(formatURL("classes", undefined, undefined, token))
				request.done(function(data){
					var data = data.response.data
					for( var i = 0; i < data.length; i++ ){
						classes[data[i].name.toLowerCase()] = data[i].id
					}
					if( classes[user] ){
						resolve(classes[user])
					}
					reject()
				})
				request.fail(function(){
					reject()
				})
			}
		}else if( type == "location"){
			if( !$.isEmptyObject(locations) ){
				resolve(locations[user])
			}else{
				var request = $.getJSON(formatURL("locations", undefined, undefined, token))
				request.done(function(data){
					var data = data.response.data
					for( var i = 0; i < data.length; i++ ){
						locations[data[i].name.toLowerCase()] = data[i].id
					}
					if( locations[user] ){
						resolve(locations[user])
					}
					reject()
				})
				request.fail(function(){
					reject()
				})
			}
		}else if( type == "name" ){
			if( !$.isEmptyObject(names) ){
				resolve(names[user])
			}else{
				var request = $.getJSON(formatURL("names", undefined, undefined, token))
				request.done(function(data){
					var data = data.response.data
					for( var i = 0; i < data.length; i++ ){
						var firstName = data[i].firstName.toLowerCase()
						var prefix = data[i].prefix ? " "+data[i].prefix.toLowerCase() : ""
						var lastName = data[i].lastName.toLowerCase()
						names[ firstName+prefix+" "+lastName ] = data[i].code
					}
					if( names[user] ){
						resolve(names[user])
					}
					reject()
				})
				request.fail(function(){
					reject()
				})
			}
		} // End if type
	}) // End return promise
}


function checkChange(thisWeek){
	return new Promise(function(resolve, reject){
		if( offset > -2 ){
			get(offset-1).then(function(lastWeek){
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
				resolve(thisWeek)
			}) // End then
		}else{
			resolve(thisWeek)
		}
	})
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


function getOnline(userCode, Offset, Type){
	Offset = Offset || offset
	return new Promise(function(resolve, reject){
		var request = $.getJSON(formatURL(Type, userCode, Offset, token))
		request.done(function(data){
			console.log("Loaded online schedule ("+Type+": "+user+" ("+userCode+"), week: "+Offset+")")
			var formattedData = format(data.response.data)
			if( userCode == defaultUser ){ // Store offline
				localStorage.setItem( "lessons-" + (new Date().getWeek()+Offset), JSON.stringify({date: Date.now(), data: formattedData}) )
			}
			resolve(formattedData)
		})
		request.fail(function(data,status,err){
			reject( new Error("Failed to update schedule\n----\nStatus: " + status + "\nError: " + err) )
		})
	})
}


function updateOffline(userCode, offset, type){
	if( userCode == defaultUser ){
		var data = getOffline(userCode, offset, type)
		if( data ){
			checkChange(data).then(function(data){
				formatSchedule(data)
				lessons[userCode] = lessons[userCode] || []
				lessons[userCode][offset+2] = data
			})
			setTimeout(function(){
				$("span.offline").css("display", "block")
			}, 1000)
			return true
		}
	}
	return false
}


function updateOnline(userCode, offset, type){
	getOnline(userCode, offset, type).then(function(data){
		checkChange(data).then(function(data){
			formatSchedule(data)
			lessons[userCode] = lessons[userCode] || []
			lessons[userCode][offset+2] = data
		})
		setTimeout(function(){
			$("span.offline").css("display", "none")
		}, 1000)
	}).catch(function(err){ throw err })
}


function update(User, Offset){
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
		var request = $.getJSON(formatURL("departments", undefined, undefined, token))
		request.done(function(data){
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
		})
	}
	
	getUserID(user, type).then(function(userCode){
		if( lessons[userCode] && lessons[userCode][offset+2] ){ // Saved locally
			formatSchedule(lessons[userCode][offset+2])
		}else{
			if( !updateOffline(userCode, offset, type) ){
				updateOnline(userCode, offset, type)
			}
		}
		
		removeOldSchedules()
	})
}


function get(offset){
	return new Promise(function(resolve, reject){
		
		if( /^[a-z]+[0-9]+[a-z]*/.test(user) || user == "aula" || user == "spil" || user == "ster_a" || user == "ster_b" ){
			type = "location"
		}else if( /^\d{1}[a-z]{1}\d{1}/.test(user) ){
			type = "class"
		}else if( /^\d{3,}/.test(user) || /^[a-z]{4}/.test(user) ){
			type = "user"
		}else{
			type = "name"
		}
		
		getUserID(user, type).then(function(userCode){
			
			if( lessons[userCode] && lessons[userCode][offset+2] ){ // Saved locally
				resolve( lessons[userCode][offset+2] )
			}else{
				lessons[userCode] = lessons[userCode] || []
				var data = getOffline(userCode, offset, type)
				
				if( data ){
					lessons[userCode][offset+2] = data
					resolve( data )
				}else{
					// Get online schedule
					getOnline(userCode, offset, type).then(function(data){
						lessons[userCode][offset+2] = data
						resolve( data )
					}).catch(function(err){ throw err })
				}
			}
			
		})
	})
}
