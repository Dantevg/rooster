// Date.prototype.getWeek = function() {
// 	var onejan = new Date(this.getFullYear(),0,1)
// 	return Math.ceil( ( ((this - onejan) / 86400000) + onejan.getDay() + 1 ) / 7 )
// }

Date.prototype.getWeek = function(){
  var d = new Date( Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()) )
  var n = d.getUTCDay() || 7
  d.setUTCDate( d.getUTCDate() + 4 - n )
  var yearStart = new Date( Date.UTC(d.getUTCFullYear(), 0, 1) )
  return Math.ceil( ( ((d - yearStart) / 86400000) + 1 ) / 7 )
}

function formatDate(d, name){
	var months = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"]
	name += "  (" + d.getDate()
	name += " " + months[d.getMonth()]
	name +=  ", week " + d.getWeek() + ")"
	return name
}