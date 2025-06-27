import { ID, OAuthProvider, Query } from "appwrite"
import { account, appwriteconfig, database } from "./client"
import { data, redirect } from "react-router"

export const loginWithGoogle = async () => {
    try {
        account.createOAuth2Session(OAuthProvider.Google)

    } catch (e){
        console.log('login with google',e)
    }
}

export const getUser = async () => {
    try {

        const user = await account.get();

        if(!user) return redirect('/sign-in');

        const {documents} = await database.listDocuments(
            appwriteconfig.databaseId,
            appwriteconfig.userCollectionId,
            [
                Query.equal('accountId', user.$id),
                Query.select(['name', 'email', 'imageUrl', 'joinedAt', 'accountId'])
            ]
        ) 
    } catch(e){
        console.log(e)
    }
}

export const logoutUser = async () => {

    try {
        await account.deleteSession('current');
        return true;

    } catch(e){
        console.log('logout user',e)
        return false;
    }
}

export const getGooglePicture = async () => {
    try {
        
        const session = await account.getSession('current');

        const oAuthToken = session.providerAccessToken;

        if(!oAuthToken) {
            console.log('No Auth token available');
            return null;
        }

        const response = await fetch(
            'https://people.googleapis.com/v1/people/me?personFields=photos',
            {
                headers: {
                    Authorization: `Bearer ${oAuthToken}`
                }
            }
        );

        if(!response.ok){
            console.log('Faile to Fetch Profile from Google People API');
            return null;
        }

        const data = await response.json();

        const photoUrl = data.photos && data.photos.length > 0 ? data.photos[0].url : null;
         
        return photoUrl;

    } catch(e){
        console.log('get profile picture error:  ',e)
    }
}

export const storeUserData  = async () => {

    try {
        const user = await account.get();

        if(!user) return null;

        // checking if the user exists already
        const {documents} = await database.listDocuments(
            appwriteconfig.databaseId,
            appwriteconfig.userCollectionId,
            [Query.equal('accountId',user.$id)]
        );

        if (documents.length > 0 ) return documents[0];

         const imageUrl = await getGooglePicture();

         const newUser = await database.createDocument(
            appwriteconfig.databaseId,
            appwriteconfig.userCollectionId,
            ID.unique(),
            {
                accountId: user.$id,
                email: user.email,
                name: user.name,
                imageUrl: imageUrl || '',
                joinedAt: new Date().toISOString()
            }
         );
         return newUser;

    } catch(e){
        console.log('Store user data error: ',e)
    }
}

export const getExistingUser = async () => {
    try {

        const user = await account.get();
         if(!user) return null;

         const{documents} = await database.listDocuments(
            appwriteconfig.databaseId,
            appwriteconfig.userCollectionId,
            [Query.equal('accountId', user.$id)]
         );

         if(documents.length === 0 ) return null;
         return documents[0];

    } catch(e){
        console.log("get Existing user Error: ",e)
    }
}

