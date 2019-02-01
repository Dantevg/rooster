var replaceLong = {
	ak: "aardrijkskunde",
	biol: "biologie",
	dutl: "duits",
	econ: "economie",
	entl: "engels",
	fatl: "frans",
	kubv: "kunst",
	mt: "mentorles",
	nat: "natuurkunde",
	netl: "nederlands",
	schk: "scheikunde",
	wisa: "wiskunde A",
	wisb: "wiskunde B",
	wisc: "wiskunde C",
	wisd: "wiskunde D",
}

var replaceShort = {
	biol: "bio",
	dutl: "du",
	econ: "eco",
	entl: "en",
	fatl: "fr",
	kubv: "ku",
	nat: "na",
	netl: "ne",
	schk: "sk",
	wisa: "wi A",
	wisb: "wi B",
	wisc: "wi C",
	wisd: "wi D",
	zbb: "zb",
}

function formatLessons(roosterdata){
	var use12h = ( Cookies.get("12h") == "true" )
	
	var join = function(data){
		var output = ""
		for( var i = 0; i < data.length; i++ ){
			if( i != 0 ){ output += ", " };
			output += "<a>" + data[i] + "</a>"
		}
		return output
	}
	
	var insert = function(cssclass, data, change){
		if(data != "" && data != undefined){
			if( typeof data == "string" ){
				$(lesson.elem).append("<span class='" + cssclass + (change ? " changed" : "") + "'>" + data + "</span><br>")
			}else if( typeof data == "object" ){
				$(lesson.elem).append("<span class='" + cssclass + (change ? " changed" : "") + "'>" + join(data) + "</span><br>")
			}
		}
	}
	
	// get date of special days
	var year = new Date().getFullYear()
	var firstDayOfMonth = new Date( year, new Date().getMonth(), 1 )
	var purplefriday = new Date( year, 11, 8 + mod(5-firstDayOfMonth.getDay(), 7) )
	
	var kingsday = new Date( new Date().getFullYear(), 3, 27 )
	if( kingsday.getDay() === 0 ){
		kingsday.setDate( kingsDay.getDate() - 1 )
	}
	
	for( var i = 0; i < roosterdata.length; i++ ){
		var lesson = roosterdata[i]
		lesson.elem = $("<div>").appendTo("main .rooster .dag-"+(lesson.day-1))
		
		$(lesson.elem).addClass("lesson")
		
		$(lesson.elem).css("top", (lesson.starttime-8.5)*70)
		$(lesson.elem).css("height", lesson.size*70)
		
		if( options.modifySubjects == "false" || options.modifySubjects == undefined ){
			insert("les-vak", lesson.subjects, lesson.subjectChanged)
		}else{
			var subject = lesson.subjects[0]
			if( options.modifySubjects == "short" ){
				insert("les-vak", replaceShort[subject] || subject, lesson.subjectChanged)
			}else if( options.modifySubjects == "long" ){
				insert("les-vak", replaceLong[subject] || subject, lesson.subjectChanged)
			}
		}
		
		insert("les-lokaal", lesson.locations, lesson.locationChanged)
		insert("les-docent", lesson.teachers)
		insert("les-opmerking", lesson.remark)
		insert("les-klas", lesson.groups)
		insert("les-tijd", lesson.startdate.toLocaleTimeString("en-US", {hour12: use12h, hour: "2-digit", minute: "2-digit"}))
		insert("les-eindtijd", lesson.enddate.toLocaleTimeString("en-US", {hour12: use12h, hour: "2-digit", minute: "2-digit"}))
		insert("les-verdanderbericht", lesson.changeDescription)

		if(lesson.type == "exam"){
			$(lesson.elem).addClass("toets")
		}
		
		// check for special days
		if( lesson.purpleFriday ){
			$(lesson.elem).addClass("purplefriday")
		}
		if( lesson.kingsday ){
			$(lesson.elem).addClass("kingsday")
		}
		
		// Check for removed lessons
		if( lesson.cancelled ){
			$(lesson.elem).addClass("cancelled")
		}
		
		var top = $(lesson.elem).css("top")
		var height = $(lesson.elem).css("height")
		$("main .rooster .dag-"+(lesson.day-1)).append("<div class='placeholder' style='top:"+top+"; height:"+height+";'></div>")
		
		$(lesson.elem).find(".les-vak")
	}
}

function registerClickCallbacks(elem){
	$(elem).click(function(){
		$("#lesson-overlay").removeClass("active")
		$(".lesson").removeClass("big")
		$("#user").val( $(this).text() )
		getUser( $(this).text() ).then(function(scheduleFor){
			options.scheduleFor = scheduleFor
			showUserName(options)
			update(options)
		})
		return false
	})
}

function formatSchedule( data, options ){
	// Empty previous schedule
	for( var i = 0; i < 5; i++ ){
		$("main .rooster .dag-"+i).empty()
	}
	
	// Format lessons
	setTimeout(function(){
		formatLessons( data, options )
		
		// Add event listeners
		$("#lesson-overlay.active").click(function(){
			$("#lesson-overlay").removeClass("active")
		})
		
		$(".lesson").click(function(e){
			e.stopPropagation()
			var thislesson = this
			
			if( $(window).width() < $(window).height() ){ // Mobile device
				$(".lesson").removeClass("big")
				setTimeout(function(){
					$(".lesson").removeClass("top")
				}, 300)
				
				if( $("#lesson-overlay.active").length >= 1 ){
					$("#lesson-overlay").removeClass("active")
					setTimeout(function(){
						$("#lesson-overlay").html( $(thislesson).html() )
						$("#lesson-overlay").addClass("active")
						registerClickCallbacks("#lesson-overlay span a")
					}, 300)
				}else{
					$("#lesson-overlay").html( $(thislesson).html() )
					$("#lesson-overlay").addClass("active")
					registerClickCallbacks("#lesson-overlay span a")
				}
			}else{ // Desktop
				$("#lesson-overlay").removeClass("active")
				
				if( $(".top").length >= 1 ){
					setTimeout(function(){
						$(".lesson").removeClass("top")
					}, 300)
					if( $(".lesson.big")[0] != thislesson ){
						setTimeout(function(){
							$(thislesson).addClass("big")
							$(thislesson).addClass("top")
						}, 300)
					}
					$(".lesson").removeClass("big")
				}else{
					$(thislesson).addClass("big")
					$(thislesson).addClass("top")
				}
			}
		})
		
		registerClickCallbacks(".lesson span a")
	}, 0)
}

function showUserName(options){
	var capitalise = function(input){
		if( !input ){ return "" }
		text = input.match(/[a-z]+/g)
		if( text.join(" ") != input ){
			// Not a name, leave it
			return input
		}
		text[0] = text[0].charAt(0).toUpperCase() + text[0].slice(1)
		text[text.length-1] = text[text.length-1].charAt(0).toUpperCase() + text[text.length-1].slice(1)
		return text.join(" ")
	}
	if( options.scheduleFor ){
		$(".userName").text( capitalise(options.scheduleFor.name) )
	}
}
