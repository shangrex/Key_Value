const express = require('express')
const bodyParser = require('body-parser')
const app = express()

var sqlite3 = require('sqlite3').verbose();
db = new sqlite3.Database("/home/F74072138/program/jstest/key_value.db",sqlite3.OPEN_READWRITE|sqlite3.OPEN_CREATE,function(e){
	//if (e) throw err;
});
//db.run("CREATE TABLE IF NOT EXISTS  tbl (id TEXT PRIMARY KEY, value TEXT)");

db.serialize(function() {
	//db.run 如果 Staff 資料表不存在，那就建立 Staff 資料表
	db.run("CREATE TABLE IF NOT EXISTS  tbl (id TEXT PRIMARY KEY, value TEXT)");
	//exec("sudo systemctl start key_value.service");
	// var stmt = db.prepare("INSERT INTO Stuff VALUES (?)");
	
	// //寫進10筆資料
	// for (var i = 0; i<10; i++) {
	// 	stmt.run("staff_number" + i);
	// }
	
	// stmt.finalize();
	
	// db.each("SELECT rowid AS id, thing FROM Stuff", function(err, row) {
	// 	//log 出所有的資料
	// 	console.log(row.id + ": " + row.thing);
	// });
});
	  

app.use(express.json()); //Used to parse JSON bodies
app.use(express.urlencoded()); //Parse URL-encoded bodies

app.post('/', function(req, res) {
	res.send('Hello World 80 port...');
	})
//set value
app.post(new RegExp('/set/.*/?'), function(req, res) {
		//console.log("get url: ", req.originalUrl);
		console.log("set key ", req.originalUrl.substring(5));
		console.log("set value: ", req.body.value);
		var varid = req.originalUrl.substring(5);
		var varvalue = req.body.value;
		db.all("SELECT * FROM tbl", (error, rows) => {
			if(error) throw error;
			for(const row of rows) {
				console.log("select result: ",row);
			}});
		//db.get(`SELECT key FROM tbl WHERE id=(?)`, varid, (err, row) => {
		//		console.log("get key value", row);
		//	});
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


		//use url 'set/:key' to get key
		//console.log(req.params);		

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
		//db.each("SELECT (value) FROM tbl where id=(?)", [varid], (error, row) => {
		//	if(error){
		//		//callback("key not found");
		//		console.log("error happened in select");
		//	}
		//	else {
        //   	rst = row.value;
        //    	callback(rst);
		//	}
    	//});
		//callback(rst);
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
