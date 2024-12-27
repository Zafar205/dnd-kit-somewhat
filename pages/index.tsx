"use client"
import { use, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db , usersRef } from '@/firebase/config';
import { ref, query, get, orderByChild, equalTo, set } from 'firebase/database';
// DnD
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import { Inter } from 'next/font/google';

// Components
import Container from '@/components/Container';
import Items from '@/components/Item';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import { Button } from '@/components/Button';
import CustomSelect from '@/components/Select';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';

const inter = Inter({ subsets: ['latin'] });

type DNDType = {
  id: UniqueIdentifier;
  title: string;
  items: {
    id: UniqueIdentifier;
    title: string;
  }[];
};

export default function Home() {
  const [containers, setContainers] = useState<DNDType[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [currentContainerId, setCurrentContainerId] = useState<UniqueIdentifier>();
  const [containerName, setContainerName] = useState('');
  const [itemName, setItemName] = useState('');
  const [showAddContainerModal, setShowAddContainerModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user] = useAuthState(auth);
  const router = useRouter();  
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [newTask, setNewTask] = useState<string>('');

    // DND Handlers
    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      }),
    );


  useEffect(() => {
    if (!user && !localStorage.getItem('user')) {
      router.push('/login');
    }
    setIsLoading(false);
  }, [user, router]);

  // Render loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Render nothing if not authenticated
  if (!user) {
    return null;
  }


  interface UserData {
    email: string;
    [key: string]: any;
  }

  const logout = () => {
    localStorage.setItem('user', "");
    signOut(auth);}



    const getUserByEmail = async (email: string): Promise<UserData | null> => {
      try {
        console.log("Checking email:", email); // Debug log
        console.log("Sanitized email:", sanitizeEmail(email));
        const userRef = ref(db, 'users/' + sanitizeEmail(email));
        const snapshot = await get(userRef);
        
        console.log("Snapshot:", snapshot.val()); // Debug log
        
        if (snapshot.exists()) {
          return snapshot.val();
        }
        return null;
      } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
      }
    };
  
  const sanitizeEmail = (email: string) => {
    return email.replace(/[.#$/[\]]/g, '_');
  };
  const writeRoomData = async (email: string, containers: DNDType[]) => {
    const userId = email; // Use email as the user ID
  
    try {
      // Create a new unique ID for the room
      const roomId = sanitizeEmail(email); 
  
      await set(ref(db, `rooms/${roomId}`), {
        id: roomId, 
        email: email,
        data: {
          containers: containers 
        },
        admin: true,
        members: [email]
      });
  
    } catch (error) {
      console.error("Error writing room data:", error);
    }
  };

  const handleTaskDelete = (containerId: UniqueIdentifier, taskId: UniqueIdentifier) => {
    console.log('containerIdDelete', containerId);
    setContainers(containers.map(container =>
      container.id === containerId
        ? { ...container, items: container.items.filter(item => item.id !== taskId) }
        : container
    ));
  };

  const handleTaskEdit = (containerId: UniqueIdentifier, taskId: UniqueIdentifier, newTitle: string) => {
    console.log("containerIdEdit", containerId);
    setContainers(containers.map(container =>
      container.id === containerId
        ? {
          ...container,
          items: container.items.map(item =>
            item.id === taskId ? { ...item, title: newTitle } : item
          )
        }
        : container
    ));
  };

  const handleTitleChange = (containerId: UniqueIdentifier, newTitle: string) => {
    setContainers(containers.map(container =>
      container.id === containerId
        ? { ...container, title: newTitle }
        : container
    ));
  };
  const handleDeleteContainer = (containerId: UniqueIdentifier) => {
    setContainers(containers.filter(container => container.id !== containerId));
  };

  const handleAddTask = async () => {
    if (!selectedContainer || !newTask) return;

    const id = `item-${uuidv4()}`;
    const updatedContainers = containers.map(container => {
      if (container.id === selectedContainer) {
        return {
          ...container,
          items: [...container.items, { id, title: newTask }]
        };
      }
      return container;
    });

    setContainers(updatedContainers);
    setNewTask('');
    setSelectedContainer('');
  };

  const onAddContainer = async () => {

    if (!showTitleInput) {
      setShowTitleInput(true);
      return;
    }
    if (!containerName) return;

    if (user?.email) {
      const userData = await getUserByEmail(user.email);
      console.log("Retrieved user data:", userData); // Debug log
    }

    const id = `container-${uuidv4()}`;
    setContainers([
      ...containers,
      {
        id,
        title: containerName,
        items: [],
      },
    ]);
    setContainerName('');
    setShowAddContainerModal(false);
    setShowTitleInput(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAddContainer();
    }
  };

  const onAddItem = () => {
    if (!itemName) return;
    const id = `item-${uuidv4()}`;
    const container = containers.find((item) => item.id === currentContainerId);
    if (!container) return;
    container.items.push({
      id,
      title: itemName,
    });
    setContainers([...containers]);
    setItemName('');
    setShowAddItemModal(false);
  };

  // Find the value of the items
  const findValueOfItems = (id: UniqueIdentifier | undefined, type: string) => {
    if (type === 'container') {
      return containers.find((item) => item.id === id);
    }
    if (type === 'item') {
      return containers.find((container) =>
        container.items.find((item) => item.id === id),
      );
    }
  }

  const findItemTitle = (id: UniqueIdentifier | undefined) => {
    const container = findValueOfItems(id, 'item');
    if (!container) return '';
    const item = container.items.find((item) => item.id === id);
    if (!item) return '';
    return item.title;
  };

  const findContainerTitle = (id: UniqueIdentifier | undefined) => {
    const container = findValueOfItems(id, 'container');
    if (!container) return '';
    return container.title;
  };

  const findContainerItems = (id: UniqueIdentifier | undefined) => {
    const container = findValueOfItems(id, 'container');
    if (!container) return [];
    return container.items;
  };



  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { id } = active;
    setActiveId(id);
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;

    // Handle Items Sorting
    if (
      active.id.toString().includes('item') &&
      over?.id.toString().includes('item') &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active container and over container
      const activeContainer = findValueOfItems(active.id, 'item');
      const overContainer = findValueOfItems(over.id, 'item');

      // If the active or over container is not found, return
      if (!activeContainer || !overContainer) return;

      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === activeContainer.id,
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === overContainer.id,
      );

      // Find the index of the active and over item
      const activeitemIndex = activeContainer.items.findIndex(
        (item) => item.id === active.id,
      );
      const overitemIndex = overContainer.items.findIndex(
        (item) => item.id === over.id,
      );
      // In the same container
      if (activeContainerIndex === overContainerIndex) {
        let newItems = [...containers];
        newItems[activeContainerIndex].items = arrayMove(
          newItems[activeContainerIndex].items,
          activeitemIndex,
          overitemIndex,
        );

        setContainers(newItems);
      } else {
        // In different containers
        let newItems = [...containers];
        const [removeditem] = newItems[activeContainerIndex].items.splice(
          activeitemIndex,
          1,
        );
        newItems[overContainerIndex].items.splice(
          overitemIndex,
          0,
          removeditem,
        );
        setContainers(newItems);
      }
    }

    // Handling Item Drop Into a Container
    if (
      active.id.toString().includes('item') &&
      over?.id.toString().includes('container') &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active and over container
      const activeContainer = findValueOfItems(active.id, 'item');
      const overContainer = findValueOfItems(over.id, 'container');

      // If the active or over container is not found, return
      if (!activeContainer || !overContainer) return;

      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === activeContainer.id,
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === overContainer.id,
      );

      // Find the index of the active and over item
      const activeitemIndex = activeContainer.items.findIndex(
        (item) => item.id === active.id,
      );

      // Remove the active item from the active container and add it to the over container
      let newItems = [...containers];
      const [removeditem] = newItems[activeContainerIndex].items.splice(
        activeitemIndex,
        1,
      );
      newItems[overContainerIndex].items.push(removeditem);
      setContainers(newItems);
    }
  };

  // This is the function that handles the sorting of the containers and items when the user is done dragging.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Handling Container Sorting
    if (
      active.id.toString().includes('container') &&
      over?.id.toString().includes('container') &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === active.id,
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === over.id,
      );
      // Swap the active and over container
      let newItems = [...containers];
      newItems = arrayMove(newItems, activeContainerIndex, overContainerIndex);
      setContainers(newItems);
    }

    // Handling item Sorting
    if (
      active.id.toString().includes('item') &&
      over?.id.toString().includes('item') &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active and over container
      const activeContainer = findValueOfItems(active.id, 'item');
      const overContainer = findValueOfItems(over.id, 'item');

      // If the active or over container is not found, return
      if (!activeContainer || !overContainer) return;
      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === activeContainer.id,
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === overContainer.id,
      );
      // Find the index of the active and over item
      const activeitemIndex = activeContainer.items.findIndex(
        (item) => item.id === active.id,
      );
      const overitemIndex = overContainer.items.findIndex(
        (item) => item.id === over.id,
      );

      // In the same container
      if (activeContainerIndex === overContainerIndex) {
        let newItems = [...containers];
        newItems[activeContainerIndex].items = arrayMove(
          newItems[activeContainerIndex].items,
          activeitemIndex,
          overitemIndex,
        );
        setContainers(newItems);
      } else {
        // In different containers
        let newItems = [...containers];
        const [removeditem] = newItems[activeContainerIndex].items.splice(
          activeitemIndex,
          1,
        );
        newItems[overContainerIndex].items.splice(
          overitemIndex,
          0,
          removeditem,
        );
        setContainers(newItems);
      }
    }
    // Handling item dropping into Container
    if (
      active.id.toString().includes('item') &&
      over?.id.toString().includes('container') &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active and over container
      const activeContainer = findValueOfItems(active.id, 'item');
      const overContainer = findValueOfItems(over.id, 'container');

      // If the active or over container is not found, return
      if (!activeContainer || !overContainer) return;
      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === activeContainer.id,
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === overContainer.id,
      );
      // Find the index of the active and over item
      const activeitemIndex = activeContainer.items.findIndex(
        (item) => item.id === active.id,
      );

      let newItems = [...containers];
      const [removeditem] = newItems[activeContainerIndex].items.splice(
        activeitemIndex,
        1,
      );
      newItems[overContainerIndex].items.push(removeditem);
      setContainers(newItems);
    }
    setActiveId(null);
  }

  return (
    <div className="mx-auto max-w-7xl py-10">
      {/* Add Container Modal */}
      <Modal
        showModal={showAddContainerModal}
        setShowModal={setShowAddContainerModal}
      >
        <div className="flex flex-col w-full items-start gap-y-4">
          <h1 className="text-gray-800 text-3xl font-bold">Add Container</h1>
          <Input
            type="text"
            placeholder="Container Title"
            name="containername"
            value={containerName}
            onChange={(e) => setContainerName(e.target.value)}
          />
          <Button onClick={onAddContainer}>Add container</Button>
        </div>
      </Modal>
      {/* Add Item Modal */}
      <Modal showModal={showAddItemModal} setShowModal={setShowAddItemModal}>
        <div className="flex flex-col w-full items-start gap-y-4">
          <h1 className="text-gray-800 text-3xl font-bold">Add Item</h1>
          <Input
            type="text"
            placeholder="Item Title"
            name="itemname"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <Button onClick={onAddItem}>Add Item</Button>
        </div>
      </Modal>
      <div className="flex gap-4 mb-6">

        <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full' onClick={logout}>Log out</button>

        <CustomSelect
          options={containers.map(container => ({ id: container.id.toString(), title: container.title }))}
          value={selectedContainer}
          onChange={(value) => setSelectedContainer(value)}
        />

        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Enter task..."
          className="px-3 py-2 border rounded-lg flex-1"
        />
        <button
          onClick={handleAddTask}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Add Task
        </button>
      </div>

      <div className="mt-10">
        <div className="flex flex-wrap items-start gap-6 pb-4 ">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-wrap items-start gap-6">
              <SortableContext items={containers.map((i) => i.id)}>
                {containers.map((container) => (
                  <Container
                    id={container.id}
                    title={container.title}
                    key={container.id}
                    onAddItem={() => {
                      setShowAddItemModal(true);
                      setCurrentContainerId(container.id);
                    }}
                    onDelete={() => handleDeleteContainer(container.id)}
                    onTitleChange={(newTitle) => handleTitleChange(container.id, newTitle)}
                  >
                    <SortableContext items={container.items.map((i) => i.id)}>
                      <div className="flex items-start flex-col gap-y-4">
                        {container.items.map((i) => (
                          <Items
                            key={i.id}
                            id={i.id}
                            title={i.title}
                            onDelete={() => handleTaskDelete(container.id, i.id)}
                            onTitleChange={(newTitle) => handleTaskEdit(container.id, i.id, newTitle)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </Container>
                ))}
              </SortableContext>

              {showTitleInput ? (
                <div className="bg-gray-200 h-[67px] w-[220px] rounded-3xl p-4 shrink-0 ">
                  <div className="relative flex items-center w-full mb-4">
                    <input
                      type="text"
                      value={containerName}
                      onChange={(e) => setContainerName(e.target.value)}
                      onKeyDown={handleTitleKeyPress}
                      className="w-full px-8 py-2 rounded-xl text-sm"
                      placeholder="Enter card title..."
                      autoFocus
                    />
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-xl font-semibold"
                      onClick={onAddContainer}
                    >
                      +
                    </button>
                  <button className= "ml-2"onClick={()=> setShowTitleInput(false)}>✖</button>
                  </div>
                </div>
              ) : (
                <Button onClick={onAddContainer} className="rounded-3xl w-[250px] h-[50px]">
                  + Add Card
                </Button>
              )}
            </div>

            <DragOverlay adjustScale={false}>
              {/* Drag Overlay For item Item */}
              {activeId && activeId.toString().includes('item') && (
                <div className='m-4 min-w-[300px]'>
                  <Items id={activeId} title={findItemTitle(activeId)} />
                </div>
              )}
              {/* Drag Overlay For Container */}
              {activeId && activeId.toString().includes('container') && (
                <Container id={activeId} title={findContainerTitle(activeId)}>
                  {findContainerItems(activeId).map((i) => (
                    <div className='m-4 min-w-[300px] ml-0 mr-0 mb-0'>
                      <Items key={i.id} title={i.title} id={i.id} />
                    </div>
                  ))}
                </Container>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
