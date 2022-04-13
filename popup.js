// parse json data
function parsePosts(globalPage, tab) {
    var url = tab.url
    var title = tab.title
    var encodedUrl = encodeURIComponent(url)

    $("div#timeout").hide(0);
    var redditPosts = lscache.get(globalPage.POST_STORAGE_KEY + tab.url)
    if (redditPosts != null && redditPosts != []) {
        processPosts(redditPosts, encodedUrl, title)
    } else {
        var promises = globalPage.gUrlToAsyncMap[tab.url]
        redditPosts = []
        if (promises != null) {
            Promise.all(promises).then(values => {
                console.log("values " + JSON.stringify(values))
                values.forEach(function (jsonData) {
                    redditPosts = redditPosts.concat(jsonData.data.children)
                });
                processPosts(redditPosts, encodedUrl, title)
            });
        }
    }
}

function processPosts(redditPosts, encodedUrl, title) {
    var submitUrl = "https://www.reddit.com/submit?url=" + encodedUrl
    if (redditPosts.length === 0) {
        $("#timeout").show(0);
    }
    else {
        makeDisplay(redditPosts, encodedUrl, title)
    }

}

function makeDisplay(redditPosts, encodedUrl, title) {
    var now = new Date();
    var date_now = new Date(now.getUTCFullYear(), now.getUTCMonth(),
        now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    var date_entry;
    var one_day = 86400000; // milliseconds per day
    var resubmitUrl = "https://www.reddit.com/submit?resubmit=true&url=" + encodedUrl;
    redditPosts.sort(comparePosts)
    var permalinks = [];
    for (var i = 0; entry = redditPosts[i]; i++) {
        date_entry = new Date(entry.data.created_utc * 1000).getTime();
        permalinks[i] = {
            link: entry.data.permalink,
            title: entry.data.title,
            score: entry.data.score + "",
            age: (date_now - date_entry) / one_day,
            comments: entry.data.num_comments + "",
            subreddit: entry.data.subreddit,
        };
    }

    // showPosts:
    var maxTitleLength = 20;
    if (title.length > maxTitleLength)
        title = title.substring(0, maxTitleLength) + "...";

    $.each(permalinks, function (index, permalink) {
        var subrLink = "https://www.reddit.com/r/" + permalink.subreddit
        url = "https://www.reddit.com" + permalink.link
        $("#links").append(
            "<li>" +
            "<div class='score'>" + permalink.score + "</div>" +
            //"<div class='subr'> r/" + permalink.subreddit + "</div>" +

            "<div class='subr'> <a href ='" + subrLink + "' target='_blank'> r/" + permalink.subreddit +
            "</a> </div>" +
            " <a href='" + url + "' title='" + permalink.link + "' target='_blank' >" +
            permalink.title + "</a>" +
            "<div class='age'>" + "  " + permalink.comments + " comments, " +
            getAge(permalink.age) + "&nbsp;&nbsp;" +
            "</div>" +
            "</li>"
        );
    });
}

function comparePosts(postA, postB) {
    return postB.data.score - postA.data.score
}

function getAge(days) {
    var age = Math.round(days.toFixed(1)) + " days ago";
    return age;
}


chrome.runtime.getBackgroundPage(function (global) {
    chrome.tabs.getSelected(null, function (tab) {
        isBlacklisted(tab,
            function (input) {
                $("div#blacklisted").show(0)
                $("div#timeout").hide(0);
            },
            function (input) {
                $("div#blacklisted").hide(0)
                parsePosts(global, tab)
            });
    });
});

