function checkChange(){
	var check = function(){
		for( var i = 0; i < lessons[ offset+2 ].length; i++ ){
			var thisLesson = lessons[ offset+2 ][i]
			var thisLessonDate = new Date(thisLesson.start*1000)
			
			for( var j = 0; j < lessons[ offset+2-1 ].length; j++ ){
				var prevLesson = lessons[ offset+2-1 ][j]
				var prevLessonDate = new Date(prevLesson.start*1000)
				
				// Check if same lesson
				if( prevLessonDate.getDay() == thisLessonDate.getDay() && prevLesson.startTimeSlot == thisLesson.startTimeSlot ){
					// Same lesson, check if changed
					if( prevLesson.locations[0] != thisLesson.locations[0] ){
						thisLesson.locationChanged = true
					}
					if( prevLesson.subjects[0] != thisLesson.subjects[0] ){
						thisLesson.subjectChanged = true
					}
					break;
				}else if( j == lessons[ offset+2-1 ].length - 1 ){
					thisLesson.locationChanged = true
					thisLesson.subjectChanged = true
				} // End if same lesson
			} // End for thisLesson
		} // End for prevLesson
		formatSchedule(offset)
	} // End function check
	
	if( !lessons[ offset+2-1 ] && offset > -2 ){
		$.getJSON( "https://citadelcollege.zportal.nl/api/v3/appointments?user=" + user + "&startWeekOffset=" + (offset-1) + "&endWeekOffset=" + offset + "&access_token=" + token )
		.done(function(data){
			lessons[ offset+2-1 ] = data.response.data
			check()
		})
		.fail(function(){
			formatSchedule(offset)
		})
	}else if( offset > -2 ){
		check()
	}else{
		formatSchedule(offset)
	}
}

function getSchedule(){
	$.getJSON( "https://citadelcollege.zportal.nl/api/v3/appointments?user=" + user + "&startWeekOffset=" + offset + "&endWeekOffset=" + (offset+1) + "&access_token=" + token )
	.done(function(data){
		console.log(data.response)
		lessons[ offset+2 ] = data.response.data
		checkChange()
		return data.response.data
	})
	.fail(function(data,status,err){
		console.log( "Fail\n----\nStatus: " + status + "\nError: " + err )
		return false
	}) // End getJSON
}
