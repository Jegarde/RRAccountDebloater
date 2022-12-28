/*
Purges your friend list BUT keeps all favorited friends.
https://github.com/Jegarde/RRAccountDebloater/
*/

// Get user section from local storage
auth = JSON.parse(localStorage.getItem("oidc.user:https://auth.rec.net:recnet"));

// Make sure the user is logged in
if (auth == null) {
    alert("You're not logged in on RecNet!");
    throw new Error("Not logged in.");
}

// Form authorization headers
headers = {"Authorization": `${auth["token_type"]} ${auth["access_token"]}`};

// Attempt to fetch all friends
friends = await fetch("https://api.rec.net/api/relationships/v6/current/friends?take=1048576", {
	"headers": headers,
    "method": "GET",
}).then(response => response.json());

// Make sure the token is valid
if ("Message" in friends) {
	alert("Your token is invalid.");
    throw new Error("Invalid token.");
}

// Get total friend count
friend_count = friends.length;

// Get all unfavorited friends
// 0 means neither has favorited each other
// 2 means the friend has you favorited, but you haven't favorited them
unfavorited = friends.filter(f => f["Favorited"] === 0 || f["Favorited"] === 2);

// Get total unfavorite count
unfavorite_count = unfavorited.length;

// Get total friend count excluding the unfavorited friends
favorite_count = friend_count - unfavorite_count;

// Make sure it's valid to proceed
if (unfavorite_count <= 0) {
	alert("No removable friends found! Either you don't have friends or all your friends are favorited.");
    throw new Error("No unfavorited people.");
}

// Prompt the user
confirm = prompt(`Found ${favorite_count} favorited friends. All ${unfavorite_count} other friends will be removed.\n\nEnter YES to proceed. This cannot be undone.`);

// Check the prompt
if (confirm !== "YES") {
	alert("Cancelled process!");
    throw new Error("Cancelled.");
}

// Unfriending function
async function unfriend(id) {
    await fetch("https://api.rec.net/api/relationships/v3/" + id, {
        "headers": headers,
        "method": "DELETE",
    });
}

// Map all unfavorited friends into unfriending requests
results = unfavorited.map(async (val) => {
    response = await unfriend(val["PlayerID"]);
    return response;
});

// Unfriend everyone
await Promise.all(results);

// Check friend count
new_friend_count = await fetch("https://api.rec.net/api/relationships/v1/current/friendscount", {
	"headers": headers,
    "method": "GET",
}).then(response => response.text());

// Show results
alert(`Unfriending done! Went from ${friend_count} to ${new_friend_count} friends.`);
