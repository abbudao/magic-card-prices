var request = require('request');
var cheerio = require('cheerio');
var Promise = require('promise');
var requestp = require('../../requestp');

/* Resource for ligamagic */
module.exports = {
  find : function(cardname, proxy) {

    /*Helper function*/
    const findPrice = (className,$) => {
      const priceElement = $("."+className)
      const priceTD = Object.keys(priceElement)
        .filter(key => priceElement[key].name=="td" )
      return priceTD.map( key => priceElement[key].children)
        .map(arrayOfElem=> parseFloat(
          arrayOfElem[0].data.split("R$")[1].replace(',','.')))
    }
    console.log("Looking for " + cardname);
    console.log("Proxy: " + proxy);
    return new Promise(function(resolve, reject) {
      var request_options = {
        headers: {
          'User-Agent' : 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.155 Safari/537.36',
          'Accept' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        url: "http://ligamagic.com.br/?view=cards%2Fsearch&card=" + cardname
      };
      requestp(request_options)
        .then(function(body) {

          if(body.indexOf("0-0") !== -1)
            reject("Card not found");

          //read the data
          var isCard = new RegExp("%3d", 'g')
          var $ = cheerio.load(body);
          var title = $(".cardTitle").text();
          var card_sets_obj = {};
          var card_set_array = [];
          var card = {};
          var moeda = "BRL";
          var card_table =$(".tabela-card").find("a")
          var a_elements = Object.keys(card_table).map( (key,index) => 
            card_table[key])
          var a_elements_attributes = a_elements.map( link => link.attribs)
          var editions = a_elements_attributes.filter( elem => elem!==undefined ).map(elem => elem.href).filter( elem => isCard.test(elem) ).map( elem=> elem.split("%3d")[1])
          var menorPreco = findPrice("menor-preco",$)
          var medioPreco= findPrice("preco-medio",$)
          var maiorPreco= findPrice("maior-preco",$)
          console.log(menorPreco)
          console.log(medioPreco)
          console.log(maiorPreco)
          editions.forEach( (edition,index)=> { 
            card_sets_obj[edition] = {}; //No prices found yet!
            card_sets_obj[edition][moeda] = [menorPreco[index],medioPreco[index],maiorPreco[index]]; //Set prices as USD
            console.log(card_sets_obj)
          })
          card["title"] = title;
          card["prices"] = card_sets_obj;
          card["sets"] = Object.keys(card_sets_obj);
          card["currencies"] = [moeda];
          card["url"] = request_options["url"];
          console.log(card)
          resolve(card);
          //resolve("Misterious card info!");
        }, function(err) {
          reject(err); //Cascading promises
        });
    });
  }
}


