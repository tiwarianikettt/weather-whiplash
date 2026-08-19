# Weather Whiplash Frontend

Open `index.html` directly or use VS Code Live Server.

The UI is already demo-ready with mock AI output. Later, replace the demo in `js/script.js` with your backend `fetch()` call and pass the returned JSON to `render(result)`.

Expected JSON:
```json
{"condition":"wet","confidence":0.91,"trend":"worsening","recommendation":"Consider tire change soon","recommendationText":"Track conditions are trending wetter.","frames":[["00:00","dry",0.94],["00:05","damp",0.87],["00:10","wet",0.91]]}
```
