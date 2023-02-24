# MinimAPI client UI

Simple UI for data edition with [MinimAPI-client](https://github.com/minimapi/minimapi-client)

See usage examples [here](https://github.com/minimapi/minimapi-examples)

## Usage

```html
<table id="my_table_id"></table>
```

```html
<script type="text/javascript" src="minimapi-client.js" ></script>
<script type="text/javascript" src="minimapi-client-ui.js" ></script>
<link rel="stylesheet" type='text/css' href="minimapi-client-ui.css">
<script>
    let client = new MinimAPI('/api/')
    let ui = new MinimAPI_UI(client, 'users', 'my_table_id')
</script>
```

