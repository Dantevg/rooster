function formatLessons(roosterdata){
	var use12h = ( Cookies.get("12h") == "true" )

	function insert(cssclass, data, change){
		if(data != "" && data != undefined){
			$(div).append("<span class='" + cssclass + (change ? " changed" : "") + "'>" + data + "</span><br>")
		}
	}

	// get date of special days
	var firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
	var purplefriday = new Date( new Date().getFullYear(), 11, firstDayOfMonth.getDate() + 7 + (5-firstDayOfMonth.getDay() % 7) )

	var kingsday = new Date( new Date().getFullYear(), 3, 27 )
	if( kingsday.getDay() === 0 ){
		kingsday.setDate( kingsDay.getDate() - 1 )
	}

	for( var i = 0; i < roosterdata.length; i++ ){
		var lesson = roosterdata[i]
		var div = $("<div>").appendTo("main .rooster .dag-"+(lesson.day-1))

		$(div).addClass("lesson")

		$(div).css("top", (lesson.starttime-8.5)*70)
		$(div).css("height", lesson.size*70)

		insert("les-vak", lesson.desc.vak, lesson.subjectChanged)
		insert("les-lokaal", lesson.desc.lokaal, lesson.locationChanged)
		insert("les-docent", lesson.desc.docenten)
		insert("les-opmerking", lesson.desc.opmerking)
		insert("les-klas", lesson.desc.klas)
		insert("les-tijd", lesson.startdate.toLocaleTimeString("en-US", {hour12: use12h, hour: "2-digit", minute: "2-digit"}))
		insert("les-eindtijd", lesson.enddate.toLocaleTimeString("en-US", {hour12: use12h, hour: "2-digit", minute: "2-digit"}))
		insert("les-verdanderbericht", lesson.desc.veranderbericht)

		if(lesson.desc.type == "exam"){
			$(div).addClass("toets")
		}

		// check for special days
		if( lesson.startdate.getMonth() == purplefriday.getMonth() && lesson.startdate.getDate() == purplefriday.getDate() ){
			$(div).addClass("purplefriday")
		}
		if( lesson.startdate.getMonth() == kingsday.getMonth() && lesson.startdate.getDate() == kingsday.getDate() ){
			$(div).addClass("kingsday")
		}

		// Check for removed lessons
		if( lesson.cancelled ){
			$(div).addClass("cancelled")
		}

		var top = $(div).css("top")
		var height = $(div).css("height")
		$("main .rooster .dag-"+(lesson.day-1)).append("<div class='placeholder' style='top:"+top+"; height:"+height+";'></div>")
	}
}

function formatSchedule(data){
	// Empty previous schedule
	for( var i = 0; i < 5; i++ ){
		$("main .rooster .dag-"+i).empty()
	}
	
	// Format lessons
	setTimeout(function(){
		formatLessons(data)
		
		// Add event listeners
		$(".lesson").click(function(e){
			e.stopPropagation()
			var thislesson = this

			if( $(".top").length >= 1 ){
				$(".lesson").removeClass("big")
				setTimeout( function(){
					$(".lesson").removeClass("top")
					$(thislesson).addClass("big")
					$(thislesson).addClass("top")
				}, 300 )
			}else{
				$(thislesson).addClass("big")
				$(thislesson).addClass("top")
			}
		})
		
		$("span.les-docent a").click(function(){
			user = $(this).text()
			update()
			$("#user").val( $(this).text() )
			return false
		})
	}, 0)
}
