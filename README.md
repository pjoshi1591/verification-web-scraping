# Verilaft


#### *Instalación rápida*

* linux/mac:

```bash
npm install && npm install -g http-server && npm install -g forever && cd pdf-server && forever start `which http-server` `pwd` && cd ..
```

* windows:

```bash
npm install && npm install -g http-server
cd pdf-server/
http-server
<dejar http-server ejecutandose y abrir una nueva terminal>
```

--------------------------------------------------------------------------------

#### *Instalación*


* `npm install` Instalar dependencias.
* `npm install -g http-server` Instalar dependencia global
* `npm install -g forever` Instalar dependencia global



--------------------------------------------------------------------------------

#### *Ejecución de http-server*


Ejecutar servidor web en terminal:
* `cd pdf-server`
* `http-server`

Ejecutar servidor web en background:
* Entrar a carpeta 'pdf-server': `cd pdf-server`
* Obtener path de http-server: `which http-server`
* Obtener path de servidor: `pwd`
* Ejecutar: `forever start <path-http-server> <path-pdf-server>`
* (Ejemplo: `forever start /Users/userName/.nvm/versions/node/v8.12.0/bin/http-server /Users/userName/verilaft-backend/pdf-server`)  
* Comprobar servidor entrando a http://localhost:8080/web/viewer.html?file=xxxx.pdf
* Para comprobar que que se este ejecutando: `forever list`
* Para detener el servicio: `forever stop <forever-id>`

En caso de que no se inicie, en windows usar:
* Ejecutar: `http-server . > http.log 2>&1 &`
* Ver proceso en ejecucion: `netstat -aon | findstr 8080`
* Detener proceso: `tskill <process-id>`


--------------------------------------------------------------------------------

#### *Uso*


Ejecutar todo:
* `npm run start`


Ejecutar cada script por separado:
* `WEB=alqaeda npm run start`
* `WEB=bidd npm run start`
* `WEB=bank-of-england npm run start`
* `WEB=contraloria npm run start`
* `WEB=dea npm run start`
* `WEB=fbi npm run start`
* `WEB=interpol npm run start`
* `WEB=onu npm run start`
* `WEB=policia-nacional npm run start`
* `WEB=procuraduria npm run start`
* `WEB=the-world-bank npm run start`
* `WEB=united-states-treasury npm run start`
* `WEB=pdf npm run start`
* `WEB=upload npm run start`


--------------------------------------------------------------------------------

#### *Notas*


* Para configurar personas a buscar editar archivo "people-test.json"
* Las capturas se guardan en la carpeta '/images' del proyecto en formato "numeroIdPersona-nombreWebsite-DD-MM-YYYY.png"
* Los pdfs se guardan en la carpeta '/pdfs' del proyecto en formato "numeroIdPersona-DD-MM-YYYY.png".
* Ejecutar `WEB=upload npm run start` intentará buscar el archivo pdf generado el mismo día.
