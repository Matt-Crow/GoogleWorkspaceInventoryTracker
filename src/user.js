/**
 * This module is responsible for services related to Users
 * 
 * Data class: User
 * #---------------#---------#
 * |         email | string  |
 * |      wantsLog | boolean |
 * | wantsLogReply | boolean |
 * |   wantsReport | boolean |
 * #---------------#---------#
 * 
 * Note that it is not an error for a user to want the log reply, yet not the 
 * log, as that allows them to learn when others update the inventory.
 */



class User {
    /**
     * 
     * @param {string} email 
     * @param {boolean|undefined} wantsLog true if this user should receive 
     *  the inventory form
     * @param {boolean|undefined} wantsLogReply the if this user should receive
     *  an email whenever someone submits the inventory form
     * @param {boolean|undefined} wantsReport true if this user should receive
     *  the restocking report email
     */
    constructor(email, wantsLog=false, wantsLogReply=false, wantsReport=false){
        mustHaveValue(email);
        this.email = email;
        this.wantsLog = !!wantsLog;
        this.wantsLogReply = !!wantsLogReply;
        this.wantsReport = !!wantsReport;
    }

    dataEquals(other){
        return this.email === other.email
            && this.wantsLog === other.wantsLog
            && this.wantsLogReply === other.wantsLogReply
            && this.wantsReport === other.wantsReport;
    }

    copy(){
        return new User(
            this.email, 
            this.wantsLog, 
            this.wantsLogReply, 
            this.wantsReport
        );
    }
}


function makeInMemoryUserRepository(users=[]){
    const repo = new InMemoryRepository(
        u => u.email,
        email => email,
        u => u.copy()
    );
    users.forEach(u => repo.addEntity(u));
    return repo;
}


class UserService {
    constructor(repo){
        this.users = repo;
    }

    /**
     * @returns {string[]} the email addresses of users who want the inventory 
     *  form
     */
    getInventoryFormEmails(){
        return this.where(u=>u.wantsLog);
    }

    where(predicate){
        return this.users.getAllEntities().filter(predicate).map(u=>u.email);
    }

    handleUserForm(user){
        if(this.users.hasEntityWithKey(user.email)){
            this.users.update(user);
        } else {
            this.users.addEntity(user);
        }
    }
}



function testUserModule(){
    const wantsLog = "baz.qux@gmail.com";
    const doesNotWantLog = "foo.bar@gmail.com";
    const users = [
        new User(doesNotWantLog),
        new User(wantsLog, true, true, true)
    ];
    const repo = makeInMemoryUserRepository(users);
    const sut = new UserService(repo);

    const actual = sut.getInventoryFormEmails();

    assertContains(wantsLog, actual);
    assertDoesNotContain(doesNotWantLog, actual);
}