import { useState, useEffect } from "react";
import {
  Authenticator,
  Button,
  Text,
  TextField,
  Heading,
  Flex,
  View,
  Image,
  Grid,
  Divider,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { getUrl } from "aws-amplify/storage";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */

Amplify.configure(outputs);
const client = generateClient({
  authMode: "userPool",
});

export default function App() {
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    fetchClubs();
  }, []);

  async function fetchClubs() {
    const { data: clubs } = await client.models.Club.list();
    await Promise.all(
      clubs.map(async (club) => {
        if (club.image) {
          const linkToStorageFile = await getUrl({
            path: ({ identityId }) => `media/${identityId}/${club.image}`,
          });
          console.log(linkToStorageFile.url);
          club.image = linkToStorageFile.url;
        }
        return club;
      })
    );
    console.log(clubs);
    setClubs(clubs);
  }

  async function createClub(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    console.log(form.get("image").name);

    const { data: newClub } = await client.models.Club.create({
      name: form.get("name"),
      description: form.get("description"),
      deadline: form.get("deadline"),
      image: form.get("image").name,
    });

    console.log(newClub);
    if (newClub.image)
      if (newClub.image)
        await uploadData({
          path: ({ identityId }) => `media/${identityId}/${newClub.image}`,

          data: form.get("image"),
        }).result;

    fetchClubs();
    event.target.reset();
  }

  async function deleteClub({ id }) {
    const toBeDeletedClub = {
      id: id,
    };

    const { data: deletedClub } = await client.models.Club.delete(
      toBeDeletedClub
    );
    console.log(deletedClub);

    fetchClubs();
  }

  return (
    <Authenticator>
      {({ signOut }) => (
        <Flex
          className="App"
          justifyContent="center"
          alignItems="center"
          direction="column"
          width="70%"
          margin="0 auto"
        >
          <Heading level={1}>My Clubs App</Heading>
          <View as="form" margin="3rem 0" onSubmit={createClub}>
            <Flex
              direction="column"
              justifyContent="center"
              gap="2rem"
              padding="2rem"
            >
              <TextField
                name="name"
                placeholder="Club Name"
                label="Club Name"
                labelHidden
                variation="quiet"
                required
              />
              <TextField
                name="description"
                placeholder="Club Description"
                label="Club Description"
                labelHidden
                variation="quiet"
                required
              />
              <TextField
                name="deadline"
                placeholder="Application Deadline"
                label="Application Deadline"
                labelHidden
                variation="quiet"
                required
              />
              <View
                name="image"
                as="input"
                type="file"
                alignSelf={"end"}
                accept="image/png, image/jpeg"
              />

              <Button type="submit" variation="primary">
                Create Club
              </Button>
            </Flex>
          </View>
          <Divider />
          <Heading level={2}>Current Clubs</Heading>
          <Grid
            margin="3rem 0"
            autoFlow="column"
            justifyContent="center"
            gap="2rem"
            alignContent="center"
          >
            {clubs.map((club) => (
              <Flex
                key={club.id || club.name}
                direction="column"
                justifyContent="center"
                alignItems="center"
                gap="2rem"
                border="1px solid #ccc"
                padding="2rem"
                borderRadius="5%"
                className="box"
              >
                <View>
                  <Heading level="3">{club.name}</Heading>
                </View>
                <Text fontStyle="italic">{club.description}</Text>
                <Text fontWeight="bold">Application Deadline: {club.deadline}</Text>
                {club.image && (
                  <Image
                    src={club.image}
                    alt={`visual aid for ${clubs.name}`}
                    style={{ width: 100 }}
                  />
                )}
                <Button
                  variation="destructive"
                  onClick={() => deleteClub(club)}
                >
                  Delete club
                </Button>
              </Flex>
            ))}
          </Grid>
          <Button onClick={signOut}>Sign Out</Button>
        </Flex>
      )}
    </Authenticator>
  );
}