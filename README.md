# csv-to-json

An API that takes a payload and converts the CSV link specified to JSON

## Additional Features

- Rate Limiting: Max of 10 requests per second
- Added timestamp to json response
- Limit number of csv to parse

## Usage

Make a POST request to [https://third-fluff-office.glitch.me/convert](https://third-fluff-office.glitch.me/convert) with body:

```js
{
  "csv":{
    "url":"https://linktocsv"
    "select_fields":[],
    "length": 100
  }
}
```

**Note: If `length` is omitted or assigned to 0, all csv data will converted to json.**

## Example

Sample request

```sh
$ curl -H "Content-Type: application/json" \
"https://third-fluff-office.glitch.me" -X POST \
-d '{"csv":{"url": "http://winterolympicsmedals.com/medals.csv", "select_fields":["Year", "City", "Sport"]}}'
```

Sample Output

```sh
{"conversion_key":"df31945f-5e7d-41f7-8ef4-69929c038077","status":"success","json":[{"Year":"1924","City":"Chamonix","Sport":"Skating"}], "timestamp":"2021-01-07T20:30:32.276Z"}
```

## Drawback

If all elements specified in `select_fields` are not headers in the csv file, it returns an array of empty objects
