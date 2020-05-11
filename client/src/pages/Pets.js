import React, { useState } from 'react';
import gql from 'graphql-tag';
import { useQuery, useMutation } from '@apollo/react-hooks';
import PetsList from '../components/PetsList';
import NewPetModal from '../components/NewPetModal';
import Loader from '../components/Loader';

const PETS_FIELDS_FRAG = gql`
  fragment PETS_FIELDS_FRAG on Pet {
    id
    name
    type
    img
    vaccinated @client
    owner {
      id
      age @client
    }
  }
`;

const ALL_PETS_QUERY = gql`
  query ALL_PETS_QUERY {
    pets {
      ...PETS_FIELDS_FRAG
    }
  }
  ${PETS_FIELDS_FRAG}
`;

const ADD_PET_MUTATION = gql`
  mutation ADD_PET_MUTATION($newPet: NewPetInput!) {
    addPet(input: $newPet) {
      ...PETS_FIELDS_FRAG
    }
  }
  ${PETS_FIELDS_FRAG}
`;

export default function Pets() {
  const [modal, setModal] = useState(false);
  const { data, loading, error } = useQuery(ALL_PETS_QUERY);
  const [createPet, newPet] = useMutation(ADD_PET_MUTATION, {
    // update runs after the response from the server comes back
    update(cache, { data: { addPet } }) {
      const { pets } = cache.readQuery({ query: ALL_PETS_QUERY });
      cache.writeQuery({
        query: ALL_PETS_QUERY,
        data: { pets: [addPet].concat(pets) }
      });
    }

    /**
     * optimisticResponse here:
     * Will occur every time createPet occurs
     * Will not have access to the input variables
     */
  });

  const onSubmit = (input) => {
    setModal(false);
    createPet({
      variables: { newPet: input },
      optimisticResponse: {
        __typename: 'Mutation',
        addPet: {
          id: input.name,
          ...input,
          img: 'https://via.placeholder/com/300',
          __typename: 'Pet'
        }
      }
    });

    /**
     * optimisticResponse here:
     * Will occur when the component requires it
     * Will have access to the input variables
     */
  };

  if (modal) {
    return <NewPetModal onSubmit={onSubmit} onCancel={() => setModal(false)} />;
  }

  if (loading) return <Loader />;
  if (error || newPet.error) return <p>Error: {error.message}</p>;

  return (
    <div className="page pets-page">
      <section>
        <div className="row betwee-xs middle-xs">
          <div className="col-xs-10">
            <h1>Pets</h1>
          </div>

          <div className="col-xs-2">
            <button onClick={() => setModal(true)}>new pet</button>
          </div>
        </div>
      </section>
      <section>
        <PetsList pets={data.pets} />
      </section>
    </div>
  );
}
