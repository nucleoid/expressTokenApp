# POC express app

Working example of login with subsequent access token auth.

You will need to add the "token" column to your local platform_remix marketers table for this to work:
```
alter table marketers add column token varchar(255);
```

After that you can npm install, and fire up the server (You can ignore the deprecated messages, I haven't gotten to looking into those, but it works as is)
```
node app.js
```

Then go to http://localhost:3000/ and log in with an actual marketer email/password.  Once it authenticates you it will redirect you to a page with your new access token.
A new access token is generated every time you log in.  I haven't implemented TTL on the tokens yet.
Once you have the token you can go to http://localhost:3000/programs?token=<access token>  to see a list of 10 programs in JSON format.

Using the http://localhost:3000/programs/:id?token=<access token> route, you can see authorization in action.