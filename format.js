function formatLessons(roosterdata){
	function insert(cssclass, data, change){
		if(data != "" && data != undefined){
			$(div).append("<span class='" + cssclass + (change ? " changed" : "") + "'>" + data + "</span><br>")
		}
	}
	
	// get date of special days
	var firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
	var purplefriday = new Date( new Date().getFullYear(), 11, firstDayOfMonth.getDate() + 7 + (5-firstDayOfMonth.getDay() % 7) )
	
	for( var i = 0; i < roosterdata.length; ++i ){
		var startdate = new Date(roosterdata[i]["start"]*1000)
		var starttime = startdate.getHours() + startdate.getMinutes()/60
		var enddate = new Date(roosterdata[i]["end"]*1000)
		var endtime = enddate.getHours() + enddate.getMinutes()/60
		var day = startdate.getDay()
		var size = endtime - starttime
		
		var desc = {}
		
		desc.vak = roosterdata[i]["subjects"].join(", ")
		
		desc.klas = roosterdata[i]["groups"].join(", ")
		
		desc.lokaal = roosterdata[i]["locations"].join(", ")
		
		desc.opmerking = roosterdata[i].remark
		
		desc.veranderbericht = roosterdata[i].changeDescription
		
		desc.type = roosterdata[i].type
		
		desc.docenten = ""
		for( var j = 0; j < roosterdata[i]["teachers"].length; j++ ){
			if( j != 0 ){ desc.docenten += ", " };
			desc.docenten += "<a href='' onclick='user=\""
			desc.docenten += roosterdata[i]["teachers"][j]
			desc.docenten += "\";getSchedule(); $(\"#user\").val(\""
			desc.docenten += roosterdata[i]["teachers"][j]
			desc.docenten += "\"); return false;'>"
			desc.docenten += roosterdata[i]["teachers"][j]
			desc.docenten += "</a>"
		}
		
		var div = $("<div>").appendTo("main .rooster")
		
		$(div).addClass("lesson")
		
		$(div).css("top", (starttime-8.5)*70)
		$(div).css("left", (day-1)*150+50)
		$(div).css("height", size*70)
		
		insert("les-vak", desc.vak, roosterdata[i].subjectChanged)
		insert("les-lokaal", desc.lokaal, roosterdata[i].locationChanged)
		insert("les-docent", desc.docenten)
		insert("les-opmerking", desc.opmerking)
		insert("les-klas", desc.klas)
		insert("les-tijd", startdate.getHours() + ":" + startdate.getMinutes())
		insert("les-eindtijd", enddate.getHours() + ":" + enddate.getMinutes())
		insert("les-verdanderbericht", desc.veranderbericht)
		
		if(desc.type == "exam"){
			$(div).addClass("toets")
		}
		
		// check for special days
		if( startdate.getMonth() == purplefriday.getMonth() && startdate.getDate() == purplefriday.getDate() ){
			$(div).addClass("purplefriday")
		}
		
		// Check for removed lessons
		if( roosterdata[i]["cancelled"] ){
			$(div).addClass("cancelled")
		}
		
		var top = $(div).css("top")
		var left = $(div).css("left")
		var height = $(div).css("height")
		$("main .rooster").append("<div class='placeholder' style='top:"+top+"; left:"+left+"; height:"+height+";'></div>")
	}
}

function formatSchedule(offset){
	$("main .rooster").empty()
	formatLessons(lessons[offset+2])
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
}