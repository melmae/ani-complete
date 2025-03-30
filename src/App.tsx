import {useEffect, useState} from 'react'
import './App.css'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

function App() {
    const [user, setUser] = useState(localStorage.getItem('anicomplete-user') ? JSON.parse(localStorage.getItem('anicomplete-user') as string) : {username: '', id: 0, theme: 'default'})
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false);

    const color = user.theme === 'default' ? 'inherit' : user.theme;

    useEffect(() => {
        if (user.username)
            getList();
    }, [])

    function getList() {
        const query = `query {
            MediaListCollection (userName: "${user.username}" userId: ${user.id} type: MANGA status: COMPLETED) {
                lists {
                    name
                    entries {
                        status
                        progress
                        media {
                            title {
                                english
                                romaji
                            }
                            chapters
                            siteUrl
                            coverImage {
                                large
                            }
                        }
                    }
                }
            }
        }`

        const url = 'https://graphql.anilist.co',
            options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                })
            };

        fetch(url, options)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then((data) => {
                setData(data.data.MediaListCollection.lists.find((l: { name: string }) => l.name === "Completed")?.entries || []);
                setLoading(false);
            })
            .catch(console.log);
    }

    function validateUsername() {
        setLoading(true);
        setData([]);

        const query = `
            query {
                User (name: "${user.username}") { 
                    id
                    options {
                        profileColor
                    }
                }
            }
        `

        const url = 'https://graphql.anilist.co',
            options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                })
            };

        fetch(url, options)
            .then(res => res.ok ? res.json() : Promise.reject(res.json()))
            .then((data) => {
                setUser({username: user.username, id: data.data.User.id, theme: data.data.User.options.profileColor});
                localStorage.setItem('anicomplete-user', JSON.stringify({username: user.username, id: data.data.User.id, theme: data.data.User.options.profileColor}));
                getList();
            })
            .catch(err => {
                setLoading(false);
                alert('Could not validate username');
                console.log(err);
            });
    }

    function clearUsername() {
        localStorage.setItem('anicomplete-user', JSON.stringify({username: '', id: 0, theme: 'default'}));
        setUser({username: '', id: -1, theme: 'default'});
        setData([]);
    }

    return (
        <div>
            <div className="flex gap-2 justify-center items-center w-full my-4">
                <Label className="mx-2" htmlFor="username">Username: </Label>
                <Input
                    className="w-md"
                    type="text"
                    id="username"
                    placeholder="Username"
                    value={user.username}
                    onChange={(e) => setUser({username: e.target.value, id: user.id})}
                    onKeyDown={(event) => event.key === 'Enter' && validateUsername()}
                />
                <Button onClick={validateUsername} type="button" style={{backgroundColor: user.theme === 'default' ? 'gray' : user.theme}}>Set</Button>
                <Button className="clear" variant="outline" onClick={clearUsername} style={{color: color, borderColor: color}}>Clear</Button>
            </div>
            <p style={{color: color}}>Total read: {data.length}</p>
            <p style={{color: color}} className="mb-2">Total mismatches: {data.filter((e: {progress: string, media: {chapters: string}} )=> e.progress != e.media.chapters).length}</p>
            {loading && <p>Loading...</p>}
            {data.filter((e: {progress: string, media: {chapters: string}}) =>
                    e.progress !== e.media.chapters)
                .sort((e1: {media: {title: {english: string, romaji: string}}}, e2: {media: {title: {english: string, romaji: string}}}) =>
                    (e1.media.title.english || e1.media.title.romaji || '').localeCompare(e2.media.title.english || e2.media.title.romaji || ''))
                .map((item: {progress: string, media: {siteUrl: string, chapters: string, title: {english: string, romaji: string}, coverImage: {large: string}}}) => {
                    return (
                        <div className="w-full flex justify-center items-center m-2">
                            <a className="w-2/3 min-w-xs" href={item.media.siteUrl} key={item.media.title.english || item.media.title.romaji} target="_blank" rel="noopener noreferrer">
                                <Card className="flex flex-row gap-3 justify-center items-center p-2">
                                    <img src={item.media.coverImage.large} alt={item.media.title.english || item.media.title.romaji} style={{ height: '60px', width: '50px' }} />
                                    <p>{item.media.title.english || item.media.title.romaji}</p>
                                    <p>Progress: {`${item.progress}/${item.media.chapters || '?'}`}</p>
                                </Card>
                            </a>
                        </div>
                    )
                })}

        </div>
    )
}

export default App
