
# Nginx & Node.js 之交差，以Key-Value為範例
my ip:172.26.4.29/24
## Javascript 預備
```
sudo apt install nodejs
```
```
sudo apt install npm
```
* 創見基礎的package 
```
npm init
```
* 下載必要用的package
```
npm install sqlite3 --save
npm install express --save
npm install body-parser --save
```

## Ngninx 預備
* 在/etc/nginx/sites-enabled/ 目錄底下創見 revers proxy 
```
server {
  listen 80;
  server_name _;
  location / {          
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
   }
}

```

然後重起nginx
```
sudo systemctl restart nginx.service
```
## Systemd設定
$PATH is your js file positoin
* 建立一個key_value.service
```
[Unit]
After=network.target
StartLimitIntervalSec=0
Description=My Node.js App

[Service]
Type=simple
Restart=always
RestartSec=1
Environment=NODE_PORT=3000 NODE_ENV=production

# 執行服務的使用者
User=ubuntu

# 啟動服務指令
ExecStart=/usr/bin/node $PATH/key_value.js

# 不正常停止時重新啟動
#Restart=on-failure

[Install]
WantedBy=multi-user.target


```

* start & enabled
```
sudo systemctl start key_value.service
sudo systemctl enable key_value.service
```
* check service status
```
sudo systemctl status key_value.service
```
## Node.js code
```javascript=
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

var sqlite3 = require('sqlite3').verbose();
db = new sqlite3.Database("/home/F74072138/program/jstest/key_value.db",sqlite3.OPEN_READWRITE|sqlite3.OPEN_CREATE,function(e){
	//if (e) throw err;
});


db.serialize(function() {

	db.run("CREATE TABLE IF NOT EXISTS  tbl (id TEXT PRIMARY KEY, value TEXT)");

});
	  

app.use(express.json()); //Used to parse JSON bodies
app.use(express.urlencoded()); //Parse URL-encoded bodies

app.post('/', function(req, res) {
	res.send('Hello World 80 port...');
	})
//set value
app.post(new RegExp('/set/.*/?'), function(req, res) {

		console.log("set key ", req.originalUrl.substring(5));
		console.log("set value: ", req.body.value);
		var varid = req.originalUrl.substring(5);
		var varvalue = req.body.value;
		db.all("SELECT * FROM tbl", (error, rows) => {
			if(error) throw error;
			for(const row of rows) {
				console.log("select result: ",row);
			}});

		db.all("SELECT exists(SELECT value FROM tbl where id=(?))",[varid], (error, rows)=>{
			var check = rows[0]['exists(SELECT value FROM tbl where id=(?))'];
			if(check == 1) {
				//exist then update value
				db.run("UPDATE tbl SET value=(?) WHERE id=(?)", [varvalue, varid]);
			}
			else {
				// not exist then insert key & value
				db.run("INSERT INTO tbl(id, value) VALUES(? ,?)", [varid, varvalue]);
			}
				console.log("exist status", rows[0]['exists(SELECT value FROM tbl where id=(?))']);
			});


	

		res.send("OK");
		})

app.get(new RegExp('/get/.*/?'), function(req, res) {
	//console.log("get url: ", req.originalUrl);			
	console.log("search key: ", req.originalUrl.substring(5));
	var varid = req.originalUrl.substring(5);
	//var rst = get_value(varid);
	var rst = "";
	function cool (varid, callback){
    	rst = "key not found";

		db.each("SELECT exists(SELECT value FROM tbl where id=(?))",[varid], (error, rows)=>{
			console.log(rows);
            var check = rows['exists(SELECT value FROM tbl where id=(?))'];
            if(check == 1) {
				//exist
				db.each("SELECT (value) FROM tbl where id=(?)", [varid], (error, row) => { 
                callback(row.value);
				});
            }
            else {
                // not exist then return not found
                callback("key not found");
            }
            });

	};
	cool(varid,function(val){
		console.log("val", val);
		res.send(val);
	});

	
	})
app.listen(3000, () => console.log('Server listen on 3000 port...'))
//db.close();
```

## DEBUG
* 查看service log
```
sudo journalctl --unit=key_value.service -e
```
* reload service
```
sudo systemctl daemon-reload

```
