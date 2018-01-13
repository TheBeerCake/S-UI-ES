var steemUSD,
    sbdUSD = 0;
var sbdChange,
    steemChange = "+0";
var sbdDelta,
    steemDelta = "";

var lastPostCount = 0;



var throtledDOMChanges = _.throttle(postListChanges, 1000);
var throtledUpdate = _.throttle(updatePrices, 300);

function postListChanges() {
    console.log("post list modified");
    let postCount = $(".PostsList__summaries").find("li").length;
    if (lastPostCount != postCount) {
        throtledUpdate();
        lastPostCount = postCount;
    }
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    lastPostCount = 0;
    setTimeout(function () {
        throtledUpdate();
        console.log("updated once");
        $("#posts_list").bind("DOMSubtreeModified", throtledDOMChanges);
    }, 300);
});


$(document).ready(function () {
    getSTEEM();
    getSBD();
    setInterval(function () {
        getSTEEM();
        getSBD();
    }, 600000);
    setTimeout(() => {
        throtledUpdate();
    }, 1000);



});

function updatePrices() {
    let posts = $(".Voting__inner");
    $.each(posts, function (key, el) {
        let post = $(el);

        let integer = post.find(".integer").html().replace(",", "");
        let decimal = post.find(".decimal").html().substring(1, post.find(".decimal").html().length);
        let summVal = +integer + (+decimal) / 100;
        let youGet = summVal * 0.75;

        let youGetSP = (youGet / 2) / steemUSD;
        let youGetSBD = (youGet / 2) * sbdUSD;
        let priceChangesSBD = "<div class='c-stats'> <div class='price'>" +sbdUSD+"$" +"<div class='delta "+sbdDelta+"'>"+sbdChange +"</div></div><div class='name'>STEEM DOLLARS (SBD)</div></div>";
        let priceChangesSP = "<div class='c-stats'> <div class='price'>" +steemUSD+"$" +"<div class='delta "+steemDelta+"'>"+steemChange +"</div></div><div class='name'>STEEM (STEEM)</div></div>";
        let popup ='<div class="ses-price-popup">'+priceChangesSBD+priceChangesSP+'</div>';

        let prices = "( " + (youGetSBD).toFixed(2) + " USD  , " + (youGetSP).toFixed(2) + " SP )"+popup;
        if (post.find(".convertedValue").length > 0) {
            // console.log("added prices")
            post.find(".convertedValue").html(prices);

        } else {
            // console.log("updated prices")
            prices = "<div class='convertedValue' >" + prices + "</div>";
            post.append(prices);

        }
    });
}

function getSTEEM() {
    $.getJSON("https://api.coinmarketcap.com/v1/ticker/steem/", function (data) {

        $.each(data, function (key, val) {
            steemUSD = data[0].price_usd;
            steemChange = data[0].percent_change_24h;
            let steem = parseFloat(steemUSD).toFixed(2);
            if (data[0].percent_change_24h > 0) {
                steemDelta = "positive";
                steemChange = " +" + steemChange + "% /24h";
            } else {
                steemDelta = "negative";
                steemChange = " " + steemChange + "% /24h";
            }
            throtledUpdate();
        });


    });
}

function getSBD() {
    $.getJSON("https://api.coinmarketcap.com/v1/ticker/steem-dollars/", function (data) {
        sbdUSD = data[0].price_usd;
        sbdEUR = sbdUSD * 0.84;
        sbdChange = data[0].percent_change_24h;
        let sbd = parseFloat(sbdUSD).toFixed(2);
        if (data[0].percent_change_24h > 0) {
            sbdDelta = "positive";
            sbdChange = "  +" + sbdChange + "% /24h";
        } else {
            sbdDelta = "negative";
            sbdChange = "  " + sbdChange + "% /24h";
        }
        throtledUpdate();

    });
}