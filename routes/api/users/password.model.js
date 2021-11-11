var conn = require('../../../utils/dao');
const bcrypt = require('bcryptjs');
var _db;

class User{
    secColl = null;
    constructor() {
      this.initModel();
    }
    async initModel(){
      try {
        _db = await conn.getDB();
        this.secColl = await _db.collection("users");
      } catch (ex) {
        console.log(ex);
        process.exit(1);
      }
    }

    async createNewUser( email, password) {
        try {
          let user = {
            email: email,
            password: await bcrypt.hash(password, 10),
            lastlogin: null,
            lastpasswordchange: null,
            passwordexpires: new Date().getTime() + (90 * 24 * 60 * 60 * 1000), 
            oldpasswords: [],
            roles:["public"]
          }
          let result = await this.secColl.insertOne(user);
          //console.log(result);
          return result;
        } catch(ex) {
          console.log(ex);
          throw(ex);
        }
    }

    async getByEmail(email){
        const filter = {"email": email};
        return await this.secColl.findOne(filter);
      }
    
    async comparePassword (rawPassword, dbPassword){
        return await bcrypt.compare(rawPassword, dbPassword);
    }

    async insertUuid(email, resetPasswdUuid){
        let filter = {"email": email};
        let updateJson ={
            "$set": {"resetPasswdUuid": resetPasswdUuid}
        };
        let result = await this.secColl.updateOne(filter, updateJson);
        return result;
    }

    async changePassword (resetPasswdUuid, newPassword){
        let filter = {"resetPasswdUuid": resetPasswdUuid};
        try{
            var lastPassword = await this.secColl.findOne(filter);
        }catch(error){
            console.log("No se pudo obtener contraseña")
        }
        let updateJson ={
            "$push": {lastPassword: lastPassword.password},
            "$set": {
                lastPasswordSwitch: new Date().getTime(),
                password: await bcrypt.hash(newPassword, 10),
                resetPasswdUuid: null
            }
        }
        let result = await this.secColl.updateOne(filter, updateJson);
        return result
    }

}

module.exports = User;