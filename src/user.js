/**
 * This module is responsible for services related to Users
 * 
 * Data class: User
 * #-------------#---------#
 * |       email | string  |
 * |    wantsLog | boolean |
 * | wantsReport | boolean |
 * #-------------#---------#
 */



class User {
    /**
     * 
     * @param {string} email 
     * @param {boolean|undefined} wantsLog - true if this user should receive 
     *  the stock update form
     * @param {boolean|undefined} wantsReport - true if this user should receive
     *  the restocking report email
     */
    constructor(email, wantsLog=false, wantsReport=false){
        mustHaveValue(email);
        this.email = email;
        this.wantsLog = wantsLog;
        this.wantsReport = wantsReport;
    }

    dataEquals(other){
        return this.email === other.email
            && this.wantsLog === other.wantsLog
            && this.wantsReport === other.wantsReport;
    }

    copy(){
        return new User(this.email, this.wantsLog, this.wantsReport);
    }
}

class InMemoryUserRepository {
    constructor(users=[]){
        this.users = new Map();
        users.forEach(u=>this.users.set(u.email, u));
    }

    addUser(user){
        if(this.hasUserWithEmail(user.email)){
            throw new Error(`User already exists with email = "${user.email}"`);
        }
        this.users.set(user.email, user.copy());
    }

    hasUserWithEmail(email){
        return this.users.has(email);
    }

    getUserByEmail(email){
        if(!this.hasUserWithEmail(email)){
            throw new Error(`No user has email = "${email}"`);
        }
        return this.users.get(email).copy();
    }

    getAllUsers(){
        return Array.from(this.users.values()).map(u=>u.copy());
    }

    updateUser(user){
        if(!this.hasUserWithEmail(user.email)){
            throw new Error(`No user has email = "${user.email}"`);
        }
        this.users.set(user.email, user);
    }
}

class UserService {
    constructor(repo){
        this.users = repo;
    }

    /**
     * @returns {string[]} the email addresses of users who want the log form
     */
    getLogFormEmails(){
        return this.users.getAllUsers().filter(u=>u.wantsLog).map(u=>u.email);
    }
}



function testUserModule(){
    const wantsLog = "baz.qux@gmail.com";
    const doesNotWantLog = "foo.bar@gmail.com";
    var users = [
        new User(doesNotWantLog),
        new User(wantsLog, true, true)
    ];
    var repo = new InMemoryUserRepository(users);
    var sut = new UserService(repo);

    var actual = sut.getLogFormEmails();

    assertContains(wantsLog, actual);
    assertDoesNotContain(doesNotWantLog, actual);
}