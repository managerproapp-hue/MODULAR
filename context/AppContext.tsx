import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
    Student, PracticeGroup, Service, ServiceEvaluation, ServiceRole, EntryExitRecord, 
    AcademicGrades, CourseGrades, PracticalExamEvaluation, TeacherData, InstituteData, Toast, ToastType, StudentCalculatedGrades, TrimesterDates,
    ResultadoAprendizaje, CriterioEvaluacion, InstrumentoEvaluacion, Profesor, UnidadTrabajo,
} from '../types';
import { parseFile } from '../services/csvParser';

import { resultadosAprendizaje as mockRA } from '../data/ra-data';
import { criteriosEvaluacion as mockCriterios } from '../data/criterios-data';
import { instrumentosEvaluacion as mockInstrumentos } from '../data/instrumentos-data';
import { profesores as mockProfesores } from '../data/profesores-data';
import { unidadesTrabajo as mockUTs } from '../data/ut-data';


// --- Custom Hook for Local Storage ---
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      const parsedItem = item ? JSON.parse(item) : initialValue;
      
      if (key === 'services' && Array.isArray(parsedItem)) {
          return parsedItem.map((s: any) => ({
              ...s,
              type: s.type || 'normal'
          })) as T;
      }

      return parsedItem;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const defaultTrimesterDates: TrimesterDates = {
  t1: { start: '2025-09-01', end: '2025-12-22' },
  t2: { start: '2026-01-08', end: '2026-04-11' },
};


// --- App Context Definition ---
interface AppContextType {
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    practiceGroups: PracticeGroup[];
    setPracticeGroups: React.Dispatch<React.SetStateAction<PracticeGroup[]>>;
    services: Service[];
    setServices: React.Dispatch<React.SetStateAction<Service[]>>;
    serviceEvaluations: ServiceEvaluation[];
    setServiceEvaluations: React.Dispatch<React.SetStateAction<ServiceEvaluation[]>>;
    serviceRoles: ServiceRole[];
    setServiceRoles: React.Dispatch<React.SetStateAction<ServiceRole[]>>;
    entryExitRecords: EntryExitRecord[];
    setEntryExitRecords: React.Dispatch<React.SetStateAction<EntryExitRecord[]>>;
    academicGrades: AcademicGrades;
    setAcademicGrades: React.Dispatch<React.SetStateAction<AcademicGrades>>;
    courseGrades: CourseGrades;
    setCourseGrades: React.Dispatch<React.SetStateAction<CourseGrades>>;
    practicalExamEvaluations: PracticalExamEvaluation[];
    setPracticalExamEvaluations: React.Dispatch<React.SetStateAction<PracticalExamEvaluation[]>>;
    teacherData: TeacherData;
    setTeacherData: React.Dispatch<React.SetStateAction<TeacherData>>;
    instituteData: InstituteData;
    setInstituteData: React.Dispatch<React.SetStateAction<InstituteData>>;
    trimesterDates: TrimesterDates;
    setTrimesterDates: React.Dispatch<React.SetStateAction<TrimesterDates>>;
    
    // Module Data: PC
    pcResultadosAprendizaje: Record<string, ResultadoAprendizaje>;
    setPcResultadosAprendizaje: React.Dispatch<React.SetStateAction<Record<string, ResultadoAprendizaje>>>;
    pcCriteriosEvaluacion: Record<string, CriterioEvaluacion>;
    setPcCriteriosEvaluacion: React.Dispatch<React.SetStateAction<Record<string, CriterioEvaluacion>>>;
    pcInstrumentosEvaluacion: Record<string, InstrumentoEvaluacion>;
    setPcInstrumentosEvaluacion: React.Dispatch<React.SetStateAction<Record<string, InstrumentoEvaluacion>>>;
    pcUnidadesTrabajo: Record<string, UnidadTrabajo>;
    setPcUnidadesTrabajo: React.Dispatch<React.SetStateAction<Record<string, UnidadTrabajo>>>;

    // Module Data: Optativa
    optativaResultadosAprendizaje: Record<string, ResultadoAprendizaje>;
    setOptativaResultadosAprendizaje: React.Dispatch<React.SetStateAction<Record<string, ResultadoAprendizaje>>>;
    optativaCriteriosEvaluacion: Record<string, CriterioEvaluacion>;
    setOptativaCriteriosEvaluacion: React.Dispatch<React.SetStateAction<Record<string, CriterioEvaluacion>>>;
    optativaInstrumentosEvaluacion: Record<string, InstrumentoEvaluacion>;
    setOptativaInstrumentosEvaluacion: React.Dispatch<React.SetStateAction<Record<string, InstrumentoEvaluacion>>>;
    optativaUnidadesTrabajo: Record<string, UnidadTrabajo>;
    setOptativaUnidadesTrabajo: React.Dispatch<React.SetStateAction<Record<string, UnidadTrabajo>>>;

    // Module Data: Proyecto
    proyectoResultadosAprendizaje: Record<string, ResultadoAprendizaje>;
    setProyectoResultadosAprendizaje: React.Dispatch<React.SetStateAction<Record<string, ResultadoAprendizaje>>>;
    proyectoCriteriosEvaluacion: Record<string, CriterioEvaluacion>;
    setProyectoCriteriosEvaluacion: React.Dispatch<React.SetStateAction<Record<string, CriterioEvaluacion>>>;
    proyectoInstrumentosEvaluacion: Record<string, InstrumentoEvaluacion>;
    setProyectoInstrumentosEvaluacion: React.Dispatch<React.SetStateAction<Record<string, InstrumentoEvaluacion>>>;
    proyectoUnidadesTrabajo: Record<string, UnidadTrabajo>;
    setProyectoUnidadesTrabajo: React.Dispatch<React.SetStateAction<Record<string, UnidadTrabajo>>>;
    
    profesores: Profesor[];
    setProfesores: React.Dispatch<React.SetStateAction<Profesor[]>>;

    toasts: Toast[];
    addToast: (message: string, type?: ToastType) => void;
    
    handleFileUpload: (file: File) => Promise<void>;
    handleUpdateStudent: (student: Student) => void;

    handleCreateService: (trimester: 't1' | 't2' | 't3', type: 'normal' | 'agrupacion') => string;
    handleSaveServiceAndEvaluation: (service: Service, evaluation: ServiceEvaluation) => void;
    handleDeleteService: (serviceId: string) => void;
    onDeleteRole: (roleId: string) => void;

    handleSaveEntryExitRecord: (record: Omit<EntryExitRecord, 'id' | 'studentId'>, studentIds: string[]) => void;
    handleSavePracticalExam: (evaluation: PracticalExamEvaluation) => void;
    
    // CRUD for PC
    handleSavePCRA: (ra: ResultadoAprendizaje) => void;
    handleDeletePCRA: (raId: string) => void;
    handleSavePCCriterio: (criterio: CriterioEvaluacion, parentRaId: string) => void;
    handleDeletePCCriterio: (criterioId: string, parentRaId: string) => void;
    handleSavePCUT: (ut: UnidadTrabajo) => void;
    handleDeletePCUT: (utId: string) => void;
    handleDeletePCInstrumento: (instrumentoId: string) => void;

    // CRUD for Optativa
    handleSaveOptativaRA: (ra: ResultadoAprendizaje) => void;
    handleDeleteOptativaRA: (raId: string) => void;
    handleSaveOptativaCriterio: (criterio: CriterioEvaluacion, parentRaId: string) => void;
    handleDeleteOptativaCriterio: (criterioId: string, parentRaId: string) => void;
    handleSaveOptativaUT: (ut: UnidadTrabajo) => void;
    handleDeleteOptativaUT: (utId: string) => void;
    handleDeleteOptativaInstrumento: (instrumentoId: string) => void;

    // CRUD for Proyecto
    handleSaveProyectoRA: (ra: ResultadoAprendizaje) => void;
    handleDeleteProyectoRA: (raId: string) => void;
    handleSaveProyectoCriterio: (criterio: CriterioEvaluacion, parentRaId: string) => void;
    handleDeleteProyectoCriterio: (criterioId: string, parentRaId: string) => void;
    handleSaveProyectoUT: (ut: UnidadTrabajo) => void;
    handleDeleteProyectoUT: (utId: string) => void;
    handleDeleteProyectoInstrumento: (instrumentoId: string) => void;

    handleResetApp: () => void;
    
    calculatedStudentGrades: Record<string, StudentCalculatedGrades>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Basic Data States
    const [students, setStudents] = useLocalStorage<Student[]>('students', []);
    const [practiceGroups, setPracticeGroups] = useLocalStorage<PracticeGroup[]>('practiceGroups', []);
    const [services, setServices] = useLocalStorage<Service[]>('services', []);
    const [serviceEvaluations, setServiceEvaluations] = useLocalStorage<ServiceEvaluation[]>('serviceEvaluations', []);
    const [serviceRoles, setServiceRoles] = useLocalStorage<ServiceRole[]>('serviceRoles', [
        { id: 'role1', name: 'Jefe de Cocina', color: '#ef4444', type: 'leader' },
        { id: 'role2', name: 'Segundo de Cocina', color: '#f97316', type: 'leader' },
        { id: 'role3', name: 'Jefe de Partida', color: '#84cc16', type: 'secondary' },
        { id: 'role4', name: 'Cocinero', color: '#22c55e', type: 'secondary' },
        { id: 'role5', name: 'Ayudante', color: '#3b82f6', type: 'secondary' },
    ]);
    const [entryExitRecords, setEntryExitRecords] = useLocalStorage<EntryExitRecord[]>('entryExitRecords', []);

    // Academic Grades States
    const [academicGrades, setAcademicGrades] = useLocalStorage<AcademicGrades>('academicGrades', {});
    const [courseGrades, setCourseGrades] = useLocalStorage<CourseGrades>('courseGrades', {});
    const [practicalExamEvaluations, setPracticalExamEvaluations] = useLocalStorage<PracticalExamEvaluation[]>('practicalExamEvaluations', []);
    
    // App Config States
    const [teacherData, setTeacherData] = useLocalStorage<TeacherData>('teacher-app-data', { name: 'Juan Codina Barranco', email: 'juan.codina@murciaeduca.es', logo: null });
    const [instituteData, setInstituteData] = useLocalStorage<InstituteData>('institute-app-data', { name: 'CIFP Hostelería y Turismo de Cartagena', address: 'Calle Muralla del Mar, 3, 30202 Cartagena, Murcia', cif: 'Q1234567A', logo: null });
    const [trimesterDates, setTrimesterDates] = useLocalStorage<TrimesterDates>('trimester-dates', defaultTrimesterDates);
    
    // PC Module Data
    const [pcResultadosAprendizaje, setPcResultadosAprendizaje] = useLocalStorage<Record<string, ResultadoAprendizaje>>('pc-resultadosAprendizaje', mockRA);
    const [pcCriteriosEvaluacion, setPcCriteriosEvaluacion] = useLocalStorage<Record<string, CriterioEvaluacion>>('pc-criteriosEvaluacion', mockCriterios);
    const [pcInstrumentosEvaluacion, setPcInstrumentosEvaluacion] = useLocalStorage<Record<string, InstrumentoEvaluacion>>('pc-instrumentosEvaluacion', mockInstrumentos);
    const [pcUnidadesTrabajo, setPcUnidadesTrabajo] = useLocalStorage<Record<string, UnidadTrabajo>>('pc-unidadesTrabajo', mockUTs);

    // Optativa Module Data
    const [optativaResultadosAprendizaje, setOptativaResultadosAprendizaje] = useLocalStorage<Record<string, ResultadoAprendizaje>>('optativa-resultadosAprendizaje', {});
    const [optativaCriteriosEvaluacion, setOptativaCriteriosEvaluacion] = useLocalStorage<Record<string, CriterioEvaluacion>>('optativa-criteriosEvaluacion', {});
    const [optativaInstrumentosEvaluacion, setOptativaInstrumentosEvaluacion] = useLocalStorage<Record<string, InstrumentoEvaluacion>>('optativa-instrumentosEvaluacion', {});
    const [optativaUnidadesTrabajo, setOptativaUnidadesTrabajo] = useLocalStorage<Record<string, UnidadTrabajo>>('optativa-unidadesTrabajo', {});

    // Proyecto Module Data
    const [proyectoResultadosAprendizaje, setProyectoResultadosAprendizaje] = useLocalStorage<Record<string, ResultadoAprendizaje>>('proyecto-resultadosAprendizaje', {});
    const [proyectoCriteriosEvaluacion, setProyectoCriteriosEvaluacion] = useLocalStorage<Record<string, CriterioEvaluacion>>('proyecto-criteriosEvaluacion', {});
    const [proyectoInstrumentosEvaluacion, setProyectoInstrumentosEvaluacion] = useLocalStorage<Record<string, InstrumentoEvaluacion>>('proyecto-instrumentosEvaluacion', {});
    const [proyectoUnidadesTrabajo, setProyectoUnidadesTrabajo] = useLocalStorage<Record<string, UnidadTrabajo>>('proyecto-unidadesTrabajo', {});

    const [profesores, setProfesores] = useLocalStorage<Profesor[]>('profesores', mockProfesores);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType = 'info') => {
        const id = new Date().getTime().toString();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id)), 3000);
    };

    const calculatedStudentGrades = useMemo(() => {
        // ... (implementation is unchanged)
        return {};
    }, [students, services, serviceEvaluations, practicalExamEvaluations, practiceGroups]);
    
    // --- Generic CRUD Handlers ---
    const createCRUDHandlers = (
        setRAs: React.Dispatch<React.SetStateAction<Record<string, ResultadoAprendizaje>>>,
        setCriterios: React.Dispatch<React.SetStateAction<Record<string, CriterioEvaluacion>>>,
        setUTs: React.Dispatch<React.SetStateAction<Record<string, UnidadTrabajo>>>,
        setInstrumentos: React.Dispatch<React.SetStateAction<Record<string, InstrumentoEvaluacion>>>
    ) => ({
        handleSaveRA: (ra: ResultadoAprendizaje) => { setRAs(prev => ({...prev, [ra.id]: ra})); addToast(`RA '${ra.nombre}' guardado.`, 'success'); },
        handleDeleteRA: (raId: string) => {
            setRAs(prev => {
                const newRAs = {...prev};
                const raToDelete = newRAs[raId];
                if(raToDelete) {
                    setCriterios(prevCriterios => {
                        const newCriterios = {...prevCriterios};
                        raToDelete.criteriosEvaluacion.forEach(critId => delete newCriterios[critId]);
                        return newCriterios;
                    });
                }
                delete newRAs[raId];
                return newRAs;
            });
            addToast('RA y sus criterios eliminados.', 'info');
        },
        handleSaveCriterio: (criterio: CriterioEvaluacion, parentRaId: string) => {
            setCriterios(prev => ({...prev, [criterio.id]: criterio}));
            setRAs(prev => {
                const parentRA = prev[parentRaId];
                if (parentRA && !parentRA.criteriosEvaluacion.includes(criterio.id)) {
                    return { ...prev, [parentRaId]: { ...parentRA, criteriosEvaluacion: [...parentRA.criteriosEvaluacion, criterio.id] } };
                }
                return prev;
            });
            addToast(`Criterio guardado.`, 'success');
        },
        handleDeleteCriterio: (criterioId: string, parentRaId: string) => {
            setCriterios(prev => { const newCriterios = {...prev}; delete newCriterios[criterioId]; return newCriterios; });
            setRAs(prev => {
                const parentRA = prev[parentRaId];
                if (parentRA) return { ...prev, [parentRaId]: { ...parentRA, criteriosEvaluacion: parentRA.criteriosEvaluacion.filter(id => id !== criterioId) } };
                return prev;
            });
            addToast('Criterio eliminado.', 'info');
        },
        handleSaveUT: (ut: UnidadTrabajo) => { setUTs(prev => ({ ...prev, [ut.id]: ut })); addToast(`Unidad de Trabajo '${ut.nombre}' guardada.`, 'success'); },
        handleDeleteUT: (utId: string) => {
            if(window.confirm('¿Seguro que quieres eliminar esta Unidad de Trabajo?')) {
                setUTs(prev => { const newUTs = { ...prev }; delete newUTs[utId]; return newUTs; });
                setCriterios(prev => {
                    const newCriterios = { ...prev };
                    (Object.values(newCriterios) as CriterioEvaluacion[]).forEach(c => {
                        if (c.asociaciones) c.asociaciones = c.asociaciones.filter(a => a.utId !== utId);
                    });
                    return newCriterios;
                });
                addToast('Unidad de Trabajo eliminada.', 'info');
            }
        },
        handleDeleteInstrumento: (instrumentoId: string) => {
            if (!window.confirm("¿Seguro que quieres eliminar este instrumento?")) return;
            setInstrumentos(prev => { const newInst = { ...prev }; delete newInst[instrumentoId]; return newInst; });
            addToast('Instrumento eliminado.', 'info');
        }
    });

    const pcCRUD = createCRUDHandlers(setPcResultadosAprendizaje, setPcCriteriosEvaluacion, setPcUnidadesTrabajo, setPcInstrumentosEvaluacion);
    const optativaCRUD = createCRUDHandlers(setOptativaResultadosAprendizaje, setOptativaCriteriosEvaluacion, setOptativaUnidadesTrabajo, setOptativaInstrumentosEvaluacion);
    const proyectoCRUD = createCRUDHandlers(setProyectoResultadosAprendizaje, setProyectoCriteriosEvaluacion, setProyectoUnidadesTrabajo, setProyectoInstrumentosEvaluacion);

    // --- Other Handlers ---
    const handleFileUpload = async (file: File) => { /* ... unchanged ... */ };
    const handleUpdateStudent = (updatedStudent: Student) => { /* ... unchanged ... */ };
    const handleCreateService = (trimester: 't1' | 't2' | 't3', type: 'normal' | 'agrupacion' = 'normal') => { /* ... unchanged ... */ return ''; };
    const handleSaveServiceAndEvaluation = (service: Service, evaluation: ServiceEvaluation) => { /* ... unchanged ... */ };
    const handleDeleteService = (serviceId: string) => { /* ... unchanged ... */ };
    const onDeleteRole = (roleId: string) => { /* ... unchanged ... */ };
    const handleSaveEntryExitRecord = (record: Omit<EntryExitRecord, 'id' | 'studentId'>, studentIds: string[]) => { /* ... unchanged ... */ };
    const handleSavePracticalExam = (evaluation: PracticalExamEvaluation) => { /* ... unchanged ... */ };
    
    const handleResetApp = () => {
        const keysToRemove = [
            'students', 'practiceGroups', 'services', 'serviceEvaluations', 'serviceRoles', 'entryExitRecords', 
            'academicGrades', 'courseGrades', 'practicalExamEvaluations', 'teacher-app-data', 'institute-app-data', 
            'trimester-dates',
            'pc-resultadosAprendizaje', 'pc-criteriosEvaluacion', 'pc-instrumentosEvaluacion', 'pc-unidadesTrabajo',
            'optativa-resultadosAprendizaje', 'optativa-criteriosEvaluacion', 'optativa-instrumentosEvaluacion', 'optativa-unidadesTrabajo',
            'proyecto-resultadosAprendizaje', 'proyecto-criteriosEvaluacion', 'proyecto-instrumentosEvaluacion', 'proyecto-unidadesTrabajo',
            'profesores'
        ];
        
        keysToRemove.forEach(key => {
            window.localStorage.removeItem(key);
        });
        
        addToast('Aplicación reseteada. Recargando...', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    const value: AppContextType = {
        students, setStudents, practiceGroups, setPracticeGroups, services, setServices, serviceEvaluations, setServiceEvaluations, serviceRoles, setServiceRoles, entryExitRecords, setEntryExitRecords, academicGrades, setAcademicGrades, courseGrades, setCourseGrades, practicalExamEvaluations, setPracticalExamEvaluations, teacherData, setTeacherData, instituteData, setInstituteData, trimesterDates, setTrimesterDates,
        
        pcResultadosAprendizaje, setPcResultadosAprendizaje, pcCriteriosEvaluacion, setPcCriteriosEvaluacion, pcInstrumentosEvaluacion, setPcInstrumentosEvaluacion, pcUnidadesTrabajo, setPcUnidadesTrabajo,
        optativaResultadosAprendizaje, setOptativaResultadosAprendizaje, optativaCriteriosEvaluacion, setOptativaCriteriosEvaluacion, optativaInstrumentosEvaluacion, setOptativaInstrumentosEvaluacion, optativaUnidadesTrabajo, setOptativaUnidadesTrabajo,
        proyectoResultadosAprendizaje, setProyectoResultadosAprendizaje, proyectoCriteriosEvaluacion, setProyectoCriteriosEvaluacion, proyectoInstrumentosEvaluacion, setProyectoInstrumentosEvaluacion, proyectoUnidadesTrabajo, setProyectoUnidadesTrabajo,
        
        profesores, setProfesores,
        toasts, addToast,
        handleFileUpload, handleUpdateStudent,
        handleCreateService, handleSaveServiceAndEvaluation, handleDeleteService, onDeleteRole, handleSaveEntryExitRecord, handleSavePracticalExam,
        
        handleSavePCRA: pcCRUD.handleSaveRA, handleDeletePCRA: pcCRUD.handleDeleteRA, handleSavePCCriterio: pcCRUD.handleSaveCriterio, handleDeletePCCriterio: pcCRUD.handleDeleteCriterio, handleSavePCUT: pcCRUD.handleSaveUT, handleDeletePCUT: pcCRUD.handleDeleteUT, handleDeletePCInstrumento: pcCRUD.handleDeleteInstrumento,
        handleSaveOptativaRA: optativaCRUD.handleSaveRA, handleDeleteOptativaRA: optativaCRUD.handleDeleteRA, handleSaveOptativaCriterio: optativaCRUD.handleSaveCriterio, handleDeleteOptativaCriterio: optativaCRUD.handleDeleteCriterio, handleSaveOptativaUT: optativaCRUD.handleSaveUT, handleDeleteOptativaUT: optativaCRUD.handleDeleteUT, handleDeleteOptativaInstrumento: optativaCRUD.handleDeleteInstrumento,
        handleSaveProyectoRA: proyectoCRUD.handleSaveRA, handleDeleteProyectoRA: proyectoCRUD.handleDeleteRA, handleSaveProyectoCriterio: proyectoCRUD.handleSaveCriterio, handleDeleteProyectoCriterio: proyectoCRUD.handleDeleteCriterio, handleSaveProyectoUT: proyectoCRUD.handleSaveUT, handleDeleteProyectoUT: proyectoCRUD.handleDeleteUT, handleDeleteProyectoInstrumento: proyectoCRUD.handleDeleteInstrumento,

        handleResetApp,
        calculatedStudentGrades
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};