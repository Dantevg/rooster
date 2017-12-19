Date.prototype.getWeek = function() {
	var onejan = new Date(this.getFullYear(),0,1);
	return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
}

function formatDate(d, name){
	var months = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"]
	name += "  (" + d.getDate()
	name += " " + months[d.getMonth()]
	name +=  ", week " + d.getWeek() + ")"
	return name
}
