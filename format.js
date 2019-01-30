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
	
	function insert(cssclass, data, change){
		if(data != "" && data != undefined){
			$(div).append("<span class='" + cssclass + (change ? " changed" : "") + "'>" + data + "</span><br>")
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
		var div = $("<div>").appendTo("main .rooster .dag-"+(lesson.day-1))
		
		$(div).addClass("lesson")
		
		$(div).css("top", (lesson.starttime-8.5)*70)
		$(div).css("height", lesson.size*70)
		
		if( options.modifySubjects == "false" || options.modifySubjects == undefined ){
			insert("les-vak", lesson.desc.vak, lesson.subjectChanged)
		}else{
			var subject = lesson.desc.vak
			if( options.modifySubjects == "short" ){
				insert("les-vak", replaceShort[subject] || subject, lesson.subjectChanged)
			}else if( options.modifySubjects == "long" ){
				insert("les-vak", replaceLong[subject] || subject, lesson.subjectChanged)
			}
		}
		
		insert("les-lokaal", lesson.desc.lokaal, lesson.locationChanged)
		insert("les-docent", lesson.desc.docent)
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
